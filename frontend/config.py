"""Configuration management for Devise Desktop Agent.

Provides local and remote configuration with polling.
"""

import json
import logging
import os
import platform
from pathlib import Path
from typing import Any, Dict, Optional


logger = logging.getLogger(__name__)


class Config:
    """Configuration manager for Devise Agent with remote config support."""

    DEFAULT_CONFIG_LOCATIONS = {
        "Windows": r"C:\ProgramData\Devise\config.json",
        "Darwin": "/Library/Application Support/Devise/config.json",
        "Linux": "/etc/devise/config.json",
    }

    DEFAULT_BACKEND_URL = "https://api.devise.example.com"
    DEFAULT_POLL_INTERVAL = 30  # seconds
    DEFAULT_CONFIG_POLL_INTERVAL = 1800  # 30 minutes
    DEFAULT_HEARTBEAT_INTERVAL = 300  # 5 minutes

    def __init__(self, config_path: Optional[str] = None):
        """Initialize configuration.

        Args:
            config_path: Optional custom config file path
        """
        self._config: Dict[str, Any] = {}
        self._config_path = config_path or self._get_default_config_path()
        self._remote_config: Dict[str, Any] = {}
        self._load_config()

    def _get_default_config_path(self) -> str:
        """Get platform-specific default config path."""
        system = platform.system()
        return self.DEFAULT_CONFIG_LOCATIONS.get(system, "/etc/devise/config.json")

    def _load_config(self) -> None:
        """Load configuration from file."""
        if os.path.exists(self._config_path):
            try:
                with open(self._config_path, "r") as f:
                    self._config = json.load(f)
            except (json.JSONDecodeError, IOError):
                self._config = {}
        else:
            self._config = {}

    def _get(self, key: str, default: Any = None) -> Any:
        """Get config value, checking remote config first.

        Args:
            key: Config key
            default: Default value if not found

        Returns:
            Config value
        """
        # Check remote config first (has priority)
        if key in self._remote_config:
            return self._remote_config[key]

        # Fall back to local config
        return self._config.get(key, default)

    def update_remote_config(self, remote_config: Dict[str, Any]) -> None:
        """Update remote configuration.

        Args:
            remote_config: Remote configuration dict
        """
        old_config = self._remote_config.copy()
        self._remote_config = remote_config

        # Log changes
        for key, value in remote_config.items():
            if old_config.get(key) != value:
                logger.info(f"Remote config updated: {key} = {value}")

    @property
    def api_key(self) -> Optional[str]:
        """Get device API key from config."""
        return self._get("api_key")

    @property
    def backend_url(self) -> str:
        """Get backend URL."""
        return self._get("backend_url", self.DEFAULT_BACKEND_URL)

    @property
    def event_endpoint(self) -> str:
        """Get full event API endpoint URL."""
        return f"{self.backend_url}/api/event"

    @property
    def registry_update_url(self) -> Optional[str]:
        """Get registry update endpoint URL."""
        return self._get("registry_update_url")

    @property
    def config_endpoint(self) -> Optional[str]:
        """Get remote config endpoint URL."""
        return self._get("config_endpoint")

    @property
    def device_id(self) -> Optional[str]:
        """Get device ID."""
        return self._get("device_id")

    @property
    def identity_config(self) -> Dict[str, Any]:
        """Get identity configuration."""
        return self._get("identity", {})

    @property
    def poll_interval(self) -> int:
        """Get polling interval in seconds."""
        return self._get("poll_interval", self.DEFAULT_POLL_INTERVAL)

    @property
    def config_poll_interval(self) -> int:
        """Get remote config polling interval in seconds."""
        return self._get("config_poll_interval", self.DEFAULT_CONFIG_POLL_INTERVAL)

    @property
    def heartbeat_interval(self) -> int:
        """Get heartbeat interval in seconds."""
        return self._get("heartbeat_interval", self.DEFAULT_HEARTBEAT_INTERVAL)

    @property
    def deduplication_window(self) -> int:
        """Get deduplication window in seconds."""
        return self._get("deduplication_window", 300)

    @property
    def debug_mode(self) -> bool:
        """Get debug mode flag."""
        return self._get("debug", False)

    @property
    def agent_version(self) -> str:
        """Get agent version."""
        return self._get("agent_version", "1.0.0")

    @property
    def remote_config_enabled(self) -> bool:
        """Check if remote config is enabled."""
        return self.config_endpoint is not None

    @property
    def doh_enabled(self) -> bool:
        """Check if DNS-over-HTTPS is enabled (default: True)."""
        return self._get("doh_enabled", True)

    def reload(self) -> None:
        """Reload configuration from disk."""
        self._load_config()


class ConfigPoller:
    """Polls remote configuration periodically."""

    def __init__(self, config: Config, device_id: str):
        """Initialize config poller.

        Args:
            config: Config instance
            device_id: Device ID for config endpoint
        """
        self._config = config
        self._device_id = device_id
        self._running = False
        self._last_config: Dict[str, Any] = {}
        self._last_fetch_time: Optional[float] = None

    async def start(self) -> None:
        """Start polling remote config."""
        if not self._config.remote_config_enabled:
            logger.debug("Remote config disabled")
            return

        self._running = True

        # Fetch initial config
        await self.fetch_config()

    async def stop(self) -> None:
        """Stop polling."""
        self._running = False

    async def fetch_config(self) -> bool:
        """Fetch remote configuration.

        Returns:
            True if config was fetched successfully
        """
        import httpx

        endpoint = self._config.config_endpoint
        if not endpoint:
            return False

        url = f"{endpoint}/{self._device_id}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {self._config.api_key}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()

                remote_config = response.json()
                self._config.update_remote_config(remote_config)
                self._last_config = remote_config

                import time

                self._last_fetch_time = time.time()

                logger.info(f"Remote config fetched: {len(remote_config)} keys")
                return True

        except Exception as e:
            logger.warning(f"Failed to fetch remote config: {e}")
            return False

    def should_poll(self) -> bool:
        """Check if it's time to poll for config updates.

        Returns:
            True if config should be polled
        """
        if not self._config.remote_config_enabled:
            return False

        import time

        if self._last_fetch_time is None:
            return True

        elapsed = time.time() - self._last_fetch_time
        return elapsed >= self._config.config_poll_interval


def get_config(config_path: Optional[str] = None) -> Config:
    """Get configuration instance.

    Args:
        config_path: Optional custom config file path

    Returns:
        Config instance
    """
    return Config(config_path)
