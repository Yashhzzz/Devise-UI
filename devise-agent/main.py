"""Devise Desktop Agent - Main Entry Point."""

import asyncio
import signal
import sys
import logging
import os
from pathlib import Path
from typing import Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class DeviseAgent:
    """Main Devise Desktop Agent application."""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the agent.

        Args:
            config_path: Optional config file path
        """
        from .config import get_config, ConfigPoller
        from .identity import get_identity
        from .detector import create_detector
        from .process_resolver import create_process_resolver
        from .dns_resolver import create_resolver
        from .registry import create_registry
        from .deduplicator import create_deduplicator
        from .event_builder import create_event_builder
        from .reporter import create_reporter
        from .queue import create_event_queue
        from .heartbeat import create_heartbeat_sender
        from .frequency_tracker import FrequencyTracker
        from .liveness_monitor import LivenessMonitor
        from .tamper_guard import TamperGuard

        # Load configuration
        self._config = get_config(config_path)

        # Initialize components
        self._identity_resolver = get_identity(config_path)

        # Initialize process resolver for FR-06, FR-07, FR-11
        self._process_resolver = create_process_resolver()

        # Initialize queue for FR-18 (offline buffering)
        # Pass api_key + device_id for encrypted queue key derivation
        _api_key = self._config.api_key or "dev-api-key"
        _device_id = self._config.device_id or self._identity_resolver.device_id
        self._queue = create_event_queue(
            encrypted=True,
            api_key=_api_key,
            device_id=_device_id,
        )

        # Initialize DNS resolver — DoH if enabled (FR-09), else system DNS
        if self._config.doh_enabled:
            try:
                from .doh_resolver import create_doh_resolver

                self._dns_resolver = create_doh_resolver()
                logger.info("DNS-over-HTTPS resolver active (Cloudflare primary)")
            except Exception as e:
                logger.warning(
                    f"DoH resolver init failed, falling back to system DNS: {e}"
                )
                self._dns_resolver = create_resolver()
        else:
            self._dns_resolver = create_resolver()

        # Initialize detector with process resolver
        self._detector = create_detector(
            self._config.poll_interval, process_resolver=self._process_resolver
        )
        self._registry = create_registry(update_url=self._config.registry_update_url)
        self._deduplicator = create_deduplicator(self._config.deduplication_window)
        self._event_builder = create_event_builder(
            self._identity_resolver.identity,
            _device_id,
        )

        # Initialize reporter with queue for FR-17 (retry logic)
        self._reporter = create_reporter(
            _api_key,
            self._config.event_endpoint,
            queue=self._queue,
        )

        # Initialize heartbeat for FR-20
        self._heartbeat = create_heartbeat_sender(
            device_id=self._identity_resolver.device_id,
            agent_version=self._config.agent_version,
            api_key=_api_key,
            event_endpoint=self._config.event_endpoint,
            queue=self._queue,
        )

        # Phase 3: Advanced modules
        self._frequency_tracker = FrequencyTracker()
        self._liveness_monitor = LivenessMonitor(
            poll_interval=self._config.poll_interval,
            version=self._config.agent_version,
        )
        self._tamper_guard = TamperGuard()

        # Initialize config poller for FR-30 (remote config)
        self._config_poller: Optional[ConfigPoller] = None
        if self._config.remote_config_enabled:
            self._config_poller = ConfigPoller(
                self._config,
                self._identity_resolver.device_id,
            )

        self._running = False
        self._shutdown_event = asyncio.Event()

        # Setup signal handlers
        self._setup_signal_handlers()

    def _setup_signal_handlers(self) -> None:
        """Setup graceful shutdown signal handlers."""
        if sys.platform != "win32":
            signal.signal(signal.SIGTERM, self._handle_shutdown)
            signal.signal(signal.SIGINT, self._handle_shutdown)

    def _handle_shutdown(self, signum, frame) -> None:
        """Handle shutdown signals."""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self._running = False
        self._shutdown_event.set()

    async def _check_registry_updates(self) -> None:
        """Check for registry updates on startup."""
        if self._config.registry_update_url:
            try:
                await self._registry.check_for_updates()
            except Exception as e:
                logger.warning(f"Registry update check failed: {e}")

    async def _check_remote_config(self) -> None:
        """Check for remote config updates."""
        if self._config_poller and self._config_poller.should_poll():
            try:
                await self._config_poller.fetch_config()
            except Exception as e:
                logger.warning(f"Remote config poll failed: {e}")

    async def _flush_queue(self) -> None:
        """Flush queued events to backend."""
        if self._queue.get_queue_depth() > 0:
            logger.info(f"Flushing {self._queue.get_queue_depth()} queued events")
            try:
                await self._reporter.flush_queue()
            except Exception as e:
                logger.warning(f"Queue flush failed: {e}")

    async def _send_tamper_alert(self, result) -> None:
        """Send tamper detection alert to backend (fire-and-forget).

        Args:
            result: TamperResult from TamperGuard.check_integrity()
        """
        import httpx

        url = f"{self._config.backend_url}/api/tamper-alert"
        payload = {
            "device_id": self._identity_resolver.device_id,
            "actual_hash": result.actual_hash,
            "expected_hash": result.expected_hash,
            "message": result.message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self._config.api_key or 'dev-api-key'}",
                        "Content-Type": "application/json",
                    },
                )
                logger.warning(f"Tamper alert sent (status={response.status_code})")
        except Exception as e:
            logger.error(f"Failed to send tamper alert: {e}")

    async def _send_gap_event(self, gap) -> None:
        """Send agent gap event to backend.

        Args:
            gap: GapResult from LivenessMonitor.check_gap()
        """
        import httpx

        url = f"{self._config.backend_url}/api/event"
        payload = {
            "type": "agent_gap",
            "device_id": self._identity_resolver.device_id,
            "gap_seconds": gap.gap_seconds,
            "last_seen": gap.last_seen.isoformat(),
            "suspicious": gap.suspicious,
            "timestamp": datetime.utcnow().isoformat(),
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self._config.api_key or 'dev-api-key'}",
                        "Content-Type": "application/json",
                    },
                )
                logger.info(
                    f"Agent gap event sent: {gap.gap_seconds:.1f}s gap "
                    f"(suspicious={gap.suspicious}, status={response.status_code})"
                )
        except Exception as e:
            logger.warning(f"Failed to send gap event: {e}")

    async def _process_connection(self, connection: dict) -> None:
        """Process a single connection.

        Args:
            connection: Connection dict from detector
        """
        remote_ip = connection.get("remote_addr")
        pid = connection.get("pid")

        if not remote_ip:
            return

        # Resolve hostname via reverse DNS (DoH or system DNS)
        hostname = self._dns_resolver.reverse_lookup(remote_ip)

        if not hostname:
            logger.debug(f"No hostname for IP: {remote_ip}")
            return

        # Match against registry
        entry = self._registry.find_match(hostname)

        if not entry:
            logger.debug(f"No registry match for: {hostname}")
            return

        # Check deduplication
        if not self._deduplicator.should_report(entry.tool_name, str(pid)):
            return

        # Get process name and path (FR-06, FR-07)
        process_name = connection.get("process_name", "unknown")
        process_path = connection.get("process_path", "")

        if not process_name or process_name == "unknown":
            if pid:
                process_info = self._detector.get_process_info(pid)
                process_name = process_info.get("process_name", "unknown")
                process_path = process_info.get("process_path", "")

        # Get I/O counters (FR-11)
        bytes_read = None
        bytes_write = None
        if pid:
            try:
                proc_info = self._process_resolver.resolve_with_io(pid)
                bytes_read = proc_info.bytes_read
                bytes_write = proc_info.bytes_write
            except Exception:
                pass

        # Track connection frequency (FR-10)
        freq_result = self._frequency_tracker.record(entry.domain)

        # Build event with process path (FR-07) + analytics fields (FR-10, FR-11)
        event = self._event_builder.build_event(
            tool_name=entry.tool_name,
            domain=entry.domain,
            category=entry.category,
            vendor=entry.vendor,
            risk_level=entry.risk_level,
            process_name=process_name or "unknown",
            process_path=process_path or "",
            is_approved=entry.enterprise_flag,
            connection_frequency=freq_result.count_5min,
            high_frequency=freq_result.high_frequency,
            bytes_read=bytes_read,
            bytes_write=bytes_write,
        )

        # Update heartbeat with last detection time (FR-20)
        self._heartbeat.update_last_detection(datetime.utcnow())

        # Report event (with retry logic - FR-17)
        success = await self._reporter.report_event(event)

        if success:
            logger.info(f"Reported: {entry.tool_name} from {process_name}")
        else:
            logger.warning(f"Failed to report: {entry.tool_name}, queued for retry")

    async def _detection_loop(self) -> None:
        """Main detection loop - runs every poll_interval seconds."""
        heartbeat_counter = 0
        config_check_counter = 0

        logger.info(
            f"Starting detection loop (interval: {self._config.poll_interval}s)"
        )

        while self._running:
            try:
                # Check remote config periodically (every ~5 minutes)
                config_check_counter += 1
                if config_check_counter >= 10:  # Every ~5 minutes
                    await self._check_remote_config()
                    config_check_counter = 0

                # Send heartbeat periodically (every ~5 minutes)
                heartbeat_counter += 1
                if heartbeat_counter >= 10:  # Every ~5 minutes (10 * 30s)
                    try:
                        await self._heartbeat.send_heartbeat()
                    except Exception as e:
                        logger.warning(f"Heartbeat failed: {e}")
                    heartbeat_counter = 0

                    # Also try to flush queue on heartbeat
                    await self._flush_queue()

                # Get new connections
                connections = self._detector.run_detection_cycle()

                logger.debug(f"Found {len(connections)} new connections")

                # Process each connection
                for connection in connections:
                    await self._process_connection(connection)

                # Cleanup old deduplication entries
                self._deduplicator.cleanup_old_entries()

                # Write liveness heartbeat (FR-29)
                self._liveness_monitor.write_liveness()

            except Exception as e:
                logger.error(f"Error in detection loop: {e}")

            # Wait for next cycle or shutdown
            try:
                await asyncio.wait_for(
                    self._shutdown_event.wait(), timeout=self._config.poll_interval
                )
                # Shutdown was requested
                break
            except asyncio.TimeoutError:
                # Normal timeout - continue loop
                continue

    async def run(self) -> None:
        """Run the agent."""
        logger.info("Devise Desktop Agent starting...")

        # Start config poller
        if self._config_poller:
            await self._config_poller.start()

        # Phase 3: Check for liveness gap (FR-29) — detect unexpected kill/suspend
        gap = self._liveness_monitor.check_gap()
        if gap:
            logger.warning(
                f"Liveness gap detected: {gap.gap_seconds:.1f}s "
                f"(suspicious={gap.suspicious})"
            )
            # Fire-and-forget gap event (don't block startup)
            asyncio.ensure_future(self._send_gap_event(gap))

        # Phase 3: Check binary integrity (FR-28)
        tamper_result = self._tamper_guard.check_integrity()
        if not tamper_result.ok:
            logger.error(f"Tamper check failed: {tamper_result.message}")
            # Fire-and-forget tamper alert (don't block startup)
            asyncio.ensure_future(self._send_tamper_alert(tamper_result))

        # Check for registry updates
        await self._check_registry_updates()

        logger.info(f"Registry loaded with {self._registry.entry_count} entries")
        logger.info(f"Identity: {self._identity_resolver.user_email}")
        logger.info(f"Device: {self._identity_resolver.device_id}")
        logger.info(f"Queue depth: {self._queue.get_queue_depth()}")
        logger.info(f"DoH enabled: {self._config.doh_enabled}")

        # Send initial heartbeat
        try:
            await self._heartbeat.send_heartbeat()
        except Exception as e:
            logger.warning(f"Initial heartbeat failed: {e}")

        self._running = True

        try:
            await self._detection_loop()
        finally:
            # Final flush on shutdown
            await self._flush_queue()
            await self._reporter.close()

            # Stop config poller
            if self._config_poller:
                await self._config_poller.stop()

            logger.info("Devise Desktop Agent stopped")

    def start(self) -> None:
        """Start the agent (sync wrapper)."""
        try:
            asyncio.run(self.run())
        except KeyboardInterrupt:
            logger.info("Agent interrupted by user")
        except Exception as e:
            logger.error(f"Agent error: {e}")
            sys.exit(1)


def main():
    """Main entry point."""
    # Determine config path
    config_path = os.environ.get("DEVISE_CONFIG_PATH") or None

    agent = DeviseAgent(config_path)
    agent.start()


if __name__ == "__main__":
    main()
