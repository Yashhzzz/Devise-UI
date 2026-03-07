"""Deduplication module for Devise Desktop Agent."""

import logging
from typing import Dict, Tuple, Optional
from datetime import datetime, timedelta
from collections import OrderedDict
import threading


logger = logging.getLogger(__name__)


class Deduplicator:
    """Session-scoped deduplication for AI events."""

    def __init__(self, window_seconds: int = 300):
        """Initialize deduplicator.

        Args:
            window_seconds: Deduplication window in seconds (default 5 min)
        """
        self._window = timedelta(seconds=window_seconds)
        self._cache: OrderedDict[Tuple[str, str], datetime] = OrderedDict()
        self._lock = threading.Lock()

    def should_report(self, tool_name: str, process_name: str) -> bool:
        """Check if this tool+process combination should be reported.

        Args:
            tool_name: Name of the AI tool
            process_name: Name of the process

        Returns:
            True if should report, False if duplicate
        """
        key = (tool_name.lower(), process_name.lower() if process_name else "unknown")

        with self._lock:
            now = datetime.utcnow()

            # Check if key exists and is within window
            if key in self._cache:
                last_seen = self._cache[key]

                if now - last_seen < self._window:
                    # Within window - duplicate
                    logger.debug(f"Duplicate: {tool_name} from {process_name}")
                    return False
                else:
                    # Outside window - update timestamp and report
                    self._cache[key] = now
                    logger.debug(
                        f"Re-reporting after window: {tool_name} from {process_name}"
                    )
                    return True

            # New entry - report and cache
            self._cache[key] = now
            logger.debug(f"New event: {tool_name} from {process_name}")
            return True

    def should_report_connection(self, hostname: str, pid: Optional[int]) -> bool:
        """Check if connection should be reported based on hostname and PID.

        Args:
            hostname: Remote hostname
            pid: Process ID

        Returns:
            True if should report, False if duplicate
        """
        process_name = str(pid) if pid else "unknown"
        return self.should_report(hostname, process_name)

    def mark_reported(self, tool_name: str, process_name: str) -> None:
        """Manually mark a tool+process as reported.

        Args:
            tool_name: Name of the AI tool
            process_name: Name of the process
        """
        key = (tool_name.lower(), process_name.lower() if process_name else "unknown")

        with self._lock:
            self._cache[key] = datetime.utcnow()

    def clear(self) -> None:
        """Clear all deduplication state."""
        with self._lock:
            self._cache.clear()

    def cleanup_old_entries(self) -> int:
        """Remove entries older than the deduplication window.

        Returns:
            Number of entries removed
        """
        with self._lock:
            now = datetime.utcnow()
            keys_to_remove = []

            for key, timestamp in self._cache.items():
                if now - timestamp >= self._window:
                    keys_to_remove.append(key)

            for key in keys_to_remove:
                del self._cache[key]

            if keys_to_remove:
                logger.debug(
                    f"Cleaned up {len(keys_to_remove)} old deduplication entries"
                )

            return len(keys_to_remove)

    def get_stats(self) -> Dict[str, int]:
        """Get deduplicator statistics.

        Returns:
            Dict with stats
        """
        with self._lock:
            return {
                "total_entries": len(self._cache),
                "window_seconds": int(self._window.total_seconds()),
            }


def create_deduplicator(window_seconds: int = 300) -> Deduplicator:
    """Create a deduplicator instance.

    Args:
        window_seconds: Deduplication window in seconds

    Returns:
        Deduplicator instance
    """
    return Deduplicator(window_seconds)
