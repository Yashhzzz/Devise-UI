"""Connection frequency tracker for Devise Desktop Agent.

Tracks how often each domain is accessed to detect high-frequency
or anomalous connection patterns (FR-10).
"""

import logging
import threading
import time
from dataclasses import dataclass
from typing import Dict, List

logger = logging.getLogger(__name__)

# Frequency window in seconds (5 minutes)
FREQUENCY_WINDOW = 300

# High-frequency threshold: hits per window
HIGH_FREQUENCY_THRESHOLD = 10


@dataclass
class FrequencyResult:
    """Result of recording a domain hit.

    Attributes:
        domain: The domain that was recorded
        count_5min: Number of hits in the last 5 minutes
        high_frequency: True if count_5min >= HIGH_FREQUENCY_THRESHOLD
    """

    domain: str
    count_5min: int
    high_frequency: bool


class FrequencyTracker:
    """Thread-safe connection frequency tracker.

    Maintains a rolling 5-minute window of connection timestamps
    per domain to identify high-frequency access patterns.
    """

    def __init__(
        self,
        window_seconds: int = FREQUENCY_WINDOW,
        threshold: int = HIGH_FREQUENCY_THRESHOLD,
    ):
        """Initialize frequency tracker.

        Args:
            window_seconds: Rolling window size in seconds (default: 300)
            threshold: Hit count threshold for high_frequency flag (default: 10)
        """
        self._window_seconds = window_seconds
        self._threshold = threshold
        self._timestamps: Dict[str, List[float]] = {}
        self._lock = threading.Lock()

    def _prune(self, domain: str, now: float) -> None:
        """Remove timestamps older than the window.

        Must be called with lock held.

        Args:
            domain: Domain to prune
            now: Current Unix timestamp
        """
        cutoff = now - self._window_seconds
        if domain in self._timestamps:
            self._timestamps[domain] = [
                ts for ts in self._timestamps[domain] if ts >= cutoff
            ]

    def record(self, domain: str) -> FrequencyResult:
        """Record a connection to domain and return frequency stats.

        Adds current timestamp, prunes old entries, and returns current
        frequency within the rolling window.

        Args:
            domain: Domain that was accessed

        Returns:
            FrequencyResult with count and high_frequency flag
        """
        now = time.time()

        with self._lock:
            if domain not in self._timestamps:
                self._timestamps[domain] = []

            # Add current timestamp
            self._timestamps[domain].append(now)

            # Prune old entries
            self._prune(domain, now)

            count = len(self._timestamps[domain])

        high_freq = count >= self._threshold

        if high_freq:
            logger.info(
                f"High-frequency domain detected: {domain} ({count} hits in {self._window_seconds}s)"
            )

        return FrequencyResult(
            domain=domain,
            count_5min=count,
            high_frequency=high_freq,
        )

    def get_frequency(self, domain: str) -> int:
        """Get current hit count for domain without recording a new hit.

        Args:
            domain: Domain to query

        Returns:
            Number of recorded hits within the rolling window
        """
        now = time.time()

        with self._lock:
            if domain not in self._timestamps:
                return 0

            # Prune to get accurate current count
            self._prune(domain, now)
            return len(self._timestamps[domain])

    def reset(self, domain: str) -> None:
        """Clear all recorded timestamps for a domain.

        Args:
            domain: Domain to reset
        """
        with self._lock:
            self._timestamps.pop(domain, None)

    def clear_all(self) -> None:
        """Clear all tracked domains (for testing)."""
        with self._lock:
            self._timestamps.clear()
