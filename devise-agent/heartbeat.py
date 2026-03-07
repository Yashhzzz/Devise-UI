"""Heartbeat module for Devise Desktop Agent.

Sends periodic health signals to the backend.
"""

import logging
import platform
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Heartbeat interval in seconds (5 minutes)
HEARTBEAT_INTERVAL = 300  # 5 minutes


class HeartbeatSender:
    """Sends periodic heartbeat events to backend."""

    def __init__(
        self,
        device_id: str,
        agent_version: str,
        api_key: str,
        event_endpoint: str,
        queue=None,
        timeout: float = 10.0,
    ):
        """Initialize heartbeat sender.

        Args:
            device_id: Device identifier
            agent_version: Agent version string
            api_key: Device API key
            event_endpoint: API endpoint URL
            queue: Optional event queue for queue_depth
            timeout: Request timeout in seconds
        """
        self._device_id = device_id
        self._agent_version = agent_version
        self._api_key = api_key
        self._event_endpoint = event_endpoint
        self._queue = queue
        self._timeout = timeout

        self._last_detection_time: Optional[datetime] = None
        self._restart_detected = False

        # Check for restart
        self._check_for_restart()

    def _check_for_restart(self) -> None:
        """Check for agent restart and flag if detected."""
        import os
        from pathlib import Path

        # Check platform-specific restart marker
        if platform.system() == "Windows":
            base = os.environ.get("APPDATA", str(Path.home() / "AppData" / "Roaming"))
        elif platform.system() == "Darwin":
            base = str(Path.home() / "Library" / "Application Support")
        else:
            base = os.environ.get(
                "XDG_DATA_HOME", str(Path.home() / ".local" / "share")
            )

        marker_path = Path(base) / "Devise" / ".restart_marker"

        if marker_path.exists():
            # Read previous uptime
            try:
                prev_uptime = float(marker_path.read_text().strip())
                # If previous uptime was very short, consider it a crash restart
                if prev_uptime < 60:  # Less than 1 minute = crash
                    self._restart_detected = True
                    logger.info("Agent restart detected (crash recovery)")
            except Exception:
                pass

        # Write current startup time marker
        marker_path.parent.mkdir(parents=True, exist_ok=True)
        marker_path.write_text(str(datetime.now(timezone.utc).timestamp()))

    def update_last_detection(self, timestamp: datetime) -> None:
        """Update last detection time.

        Args:
            timestamp: Detection timestamp
        """
        self._last_detection_time = timestamp

    def get_queue_depth(self) -> int:
        """Get current queue depth.

        Returns:
            Number of pending events in queue, or 0 if no queue
        """
        if self._queue:
            return self._queue.get_queue_depth()
        return 0

    def get_os_version(self) -> str:
        """Get OS version string.

        Returns:
            OS version description
        """
        return f"{platform.system()} {platform.release()}"

    def build_heartbeat_payload(self) -> Dict[str, Any]:
        """Build heartbeat payload.

        Returns:
            Heartbeat event dict
        """
        return {
            "event_type": "heartbeat",
            "device_id": self._device_id,
            "agent_version": self._agent_version,
            "queue_depth": self.get_queue_depth(),
            "last_detection_time": (
                self._last_detection_time.isoformat()
                if self._last_detection_time
                else None
            ),
            "os_version": self.get_os_version(),
            "restart_detected": self._restart_detected,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def send_heartbeat(self) -> bool:
        """Send heartbeat to backend.

        Returns:
            True if successful, False otherwise
        """
        import httpx

        payload = self.build_heartbeat_payload()

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    self._event_endpoint,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()

                logger.info(
                    f"Heartbeat sent: queue_depth={payload['queue_depth']}, "
                    f"restart={payload['restart_detected']}"
                )

                # Reset restart flag after successful send
                self._restart_detected = False
                return True

        except Exception as e:
            logger.warning(f"Failed to send heartbeat: {e}")
            return False


def create_heartbeat_sender(
    device_id: str,
    agent_version: str,
    api_key: str,
    event_endpoint: str,
    queue=None,
) -> HeartbeatSender:
    """Create a heartbeat sender instance.

    Args:
        device_id: Device identifier
        agent_version: Agent version string
        api_key: Device API key
        event_endpoint: API endpoint URL
        queue: Optional event queue

    Returns:
        HeartbeatSender instance
    """
    return HeartbeatSender(
        device_id=device_id,
        agent_version=agent_version,
        api_key=api_key,
        event_endpoint=event_endpoint,
        queue=queue,
    )
