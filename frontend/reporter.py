"""HTTP reporter module for Devise Desktop Agent.

Provides retry logic with exponential backoff and offline queue integration.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

import httpx


logger = logging.getLogger(__name__)

# Backoff intervals in seconds
BACKOFF_INTERVALS = [30, 60, 120, 300]
MAX_RETRIES = 4
BATCH_SIZE = 100


class Reporter:
    """HTTP event reporter to backend API with retry logic."""

    def __init__(
        self,
        api_key: str,
        endpoint: str,
        timeout: float = 10.0,
        queue=None,
    ):
        """Initialize reporter.

        Args:
            api_key: Device API key for authentication
            endpoint: Full API endpoint URL
            timeout: Request timeout in seconds
            queue: Optional EventQueue for offline buffering
        """
        self._api_key = api_key
        self._endpoint = endpoint
        self._timeout = timeout
        self._queue = queue
        self._client: Optional[httpx.AsyncClient] = None

    def set_queue(self, queue) -> None:
        """Set the event queue for offline buffering.

        Args:
            queue: EventQueue instance
        """
        self._queue = queue

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client.

        Returns:
            httpx AsyncClient instance
        """
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                headers={
                    "Authorization": f"Bearer {self._api_key}",
                    "Content-Type": "application/json",
                },
            )
        return self._client

    async def _check_connectivity(self) -> bool:
        """Check if backend is reachable.

        Returns:
            True if backend is reachable
        """
        try:
            client = await self._get_client()
            # Try a lightweight request to check connectivity
            response = await client.head(self._endpoint, timeout=5.0)
            return response.status_code < 500
        except Exception:
            return False

    async def report_event(self, event: Dict[str, Any]) -> bool:
        """Report event to backend with retry logic.

        Args:
            event: Event dict to send

        Returns:
            True if successful, False otherwise
        """
        for attempt in range(MAX_RETRIES + 1):
            try:
                client = await self._get_client()
                response = await client.post(self._endpoint, json=event)
                response.raise_for_status()

                logger.debug(f"Event reported successfully: {event.get('event_id')}")
                return True

            except httpx.HTTPStatusError as e:
                # Non-retryable client errors (4xx)
                if 400 <= e.response.status_code < 500:
                    logger.warning(
                        f"Client error reporting event: {e.response.status_code}"
                    )
                    return False

                # Server errors (5xx) - retry
                logger.warning(
                    f"Server error (attempt {attempt + 1}): {e.response.status_code}"
                )

            except httpx.RequestError as e:
                logger.warning(f"Request error (attempt {attempt + 1}): {e}")

            except Exception as e:
                logger.warning(f"Unexpected error (attempt {attempt + 1}): {e}")

            # Check if we should retry
            if attempt < MAX_RETRIES:
                backoff = BACKOFF_INTERVALS[attempt]
                logger.info(f"Retrying in {backoff}s...")
                await asyncio.sleep(backoff)
            else:
                # All retries exhausted
                logger.warning(
                    f"Event reporting failed after {MAX_RETRIES + 1} attempts"
                )

        # All retries exhausted - try to queue if available
        if self._queue:
            logger.info("Queueing event for later retry")
            self._queue.enqueue(event)
            return False

        return False

    async def report_events(self, events: List[Dict[str, Any]]) -> Dict[str, int]:
        """Report multiple events to backend.

        Args:
            events: List of event dicts

        Returns:
            Dict with success/failure counts
        """
        results = {"success": 0, "failure": 0, "queued": 0}

        # Check connectivity first
        connected = await self._check_connectivity()

        if not connected:
            # Queue all events if offline
            if self._queue:
                for event in events:
                    self._queue.enqueue(event)
                results["queued"] = len(events)
                logger.info(f"Offline - queued {len(events)} events")
                return results
            else:
                logger.warning("Offline and no queue available")

        # Try to send batch
        if len(events) > BATCH_SIZE:
            # Split into batches
            for i in range(0, len(events), BATCH_SIZE):
                batch = events[i : i + BATCH_SIZE]
                batch_result = await self._send_batch(batch)
                results["success"] += batch_result["success"]
                results["failure"] += batch_result["failure"]
        else:
            batch_result = await self._send_batch(events)
            results["success"] = batch_result["success"]
            results["failure"] = batch_result["failure"]

        logger.info(
            f"Batch report: {results['success']} success, "
            f"{results['failure']} failed, {results['queued']} queued"
        )
        return results

    async def _send_batch(self, events: List[Dict[str, Any]]) -> Dict[str, int]:
        """Send a batch of events.

        Args:
            events: List of event dicts

        Returns:
            Dict with success/failure counts
        """
        results = {"success": 0, "failure": 0}

        for event in events:
            if await self.report_event(event):
                results["success"] += 1
            else:
                results["failure"] += 1

        return results

    async def flush_queue(self) -> Dict[str, int]:
        """Flush events from queue to backend.

        Returns:
            Dict with success/failure counts
        """
        if not self._queue:
            return {"success": 0, "failure": 0, "skipped": 0}

        results = {"success": 0, "failure": 0, "skipped": 0}

        # Check connectivity
        if not await self._check_connectivity():
            logger.info("Backend unreachable, skipping queue flush")
            results["skipped"] = self._queue.get_queue_depth()
            return results

        # Get pending events
        pending = self._queue.get_pending(limit=BATCH_SIZE)

        if not pending:
            logger.debug("No pending events to flush")
            return results

        logger.info(f"Flushing {len(pending)} events from queue")

        # Send events
        success_ids = []
        failed_ids = []

        for event in pending:
            queue_id = event.get("_queue_id")
            if await self.report_event(event):
                if queue_id:
                    success_ids.append(queue_id)
            else:
                if queue_id:
                    failed_ids.append(queue_id)

        # Mark events as processed
        if success_ids:
            self._queue.mark_success(success_ids)
            results["success"] = len(success_ids)

        if failed_ids:
            self._queue.mark_failed(failed_ids)
            results["failure"] = len(failed_ids)

        logger.info(
            f"Queue flush: {results['success']} sent, {results['failure']} failed"
        )

        return results

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def __aenter__(self) -> "Reporter":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        """Async context manager exit."""
        await self.close()


def create_reporter(
    api_key: str,
    endpoint: str,
    timeout: float = 10.0,
    queue=None,
) -> Reporter:
    """Create a reporter instance.

    Args:
        api_key: Device API key
        endpoint: API endpoint URL
        timeout: Request timeout
        queue: Optional EventQueue

    Returns:
        Reporter instance
    """
    return Reporter(api_key, endpoint, timeout, queue)
