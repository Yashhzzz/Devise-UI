"""Liveness monitor for kill/suspend detection (FR-29).

Writes periodic heartbeat timestamps to disk. On next startup, detects
suspicious gaps that indicate the agent was killed or suspended.
"""

import json
import logging
import os
import platform
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class GapResult:
    """Result of a liveness gap check.

    Attributes:
        gap_seconds: Seconds elapsed since last liveness write
        last_seen: Datetime of last recorded liveness write
        suspicious: True if gap >> poll_interval (potential kill/suspend)
    """

    gap_seconds: float
    last_seen: datetime
    suspicious: bool


class LivenessMonitor:
    """Monitors agent liveness by writing periodic heartbeat files.

    Detects unexpected gaps between runs (kill signals, suspend, crash)
    by comparing the last recorded timestamp against the expected poll interval.
    """

    LIVENESS_FILE = "liveness.json"

    def __init__(self, poll_interval: int = 30, version: str = "1.0.0"):
        """Initialize liveness monitor.

        Args:
            poll_interval: Expected interval between writes in seconds
            version: Agent version string for liveness record
        """
        self._poll_interval = poll_interval
        self._version = version
        self._liveness_path = self._get_liveness_path()

    def _get_liveness_path(self) -> Path:
        """Get platform-specific liveness file path.

        Returns:
            Path to liveness.json
        """
        system = platform.system()
        if system == "Windows":
            base = os.environ.get("APPDATA", str(Path.home() / "AppData" / "Roaming"))
        elif system == "Darwin":
            base = str(Path.home() / "Library" / "Application Support")
        else:
            base = os.environ.get(
                "XDG_DATA_HOME", str(Path.home() / ".local" / "share")
            )

        d = Path(base) / "Devise"
        d.mkdir(parents=True, exist_ok=True)
        return d / self.LIVENESS_FILE

    def write_liveness(self) -> None:
        """Write current timestamp to liveness file.

        Called each detection cycle to track agent heartbeat.
        Failures are logged but not raised.
        """
        try:
            data = {
                "last_seen": datetime.now(timezone.utc).isoformat(),
                "version": self._version,
                "pid": os.getpid(),
            }
            self._liveness_path.write_text(json.dumps(data))
        except Exception as e:
            logger.warning(f"Failed to write liveness: {e}")

    def check_gap(self) -> Optional[GapResult]:
        """Check for suspicious gap since last liveness write.

        Called on startup to detect if agent was killed or suspended.
        Returns None if no liveness file exists (first run).

        Returns:
            GapResult if gap exceeds 2x poll_interval, None otherwise
        """
        if not self._liveness_path.exists():
            logger.debug("No liveness file found (first run or clean install)")
            return None

        try:
            data = json.loads(self._liveness_path.read_text())
            last_seen_str = data.get("last_seen")
            if not last_seen_str:
                return None

            last_seen = datetime.fromisoformat(last_seen_str)
            now = datetime.now(timezone.utc)
            gap = (now - last_seen).total_seconds()

            # Normal threshold: 2x poll_interval (accounts for shutdown/restart)
            threshold = self._poll_interval * 2

            if gap > threshold:
                # Suspicious if gap is > 10x poll_interval
                suspicious = gap > self._poll_interval * 10
                logger.info(
                    f"Liveness gap detected: {gap:.1f}s "
                    f"(threshold={threshold}s, suspicious={suspicious})"
                )
                return GapResult(
                    gap_seconds=gap,
                    last_seen=last_seen,
                    suspicious=suspicious,
                )

        except Exception as e:
            logger.warning(f"Failed to check liveness gap: {e}")

        return None
