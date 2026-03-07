"""User identity resolution for Devise Desktop Agent."""

import os
import getpass
import platform
import subprocess
import uuid
import socket
import time
from typing import Dict, Optional
from .config import get_config


# Module-level cache for get_current_user()
_cached_user: Optional[Dict[str, str]] = None
_cache_time: float = 0.0
_USER_CACHE_TTL = 30.0  # seconds


class IdentityResolver:
    """Resolves user identity from config or OS fallback."""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize identity resolver.

        Args:
            config_path: Optional config file path
        """
        self._config = get_config(config_path)
        self._identity = self._resolve_identity()

    def _get_hostname(self) -> str:
        """Get system hostname."""
        return socket.gethostname()

    def _get_device_id(self) -> str:
        """Generate or retrieve device ID."""
        # Try config first
        config_device_id = self._config.device_id
        if config_device_id:
            return config_device_id

        # Generate from hostname + random (stable for this machine)
        hostname = self._get_hostname()
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, hostname))

    def _resolve_identity(self) -> Dict[str, str]:
        """Resolve identity from MDM config or fall back to OS."""
        identity_config = self._config.identity_config

        # Primary: MDM-injected config (FR-23, FR-24)
        user_id = identity_config.get("user_id")
        user_email = identity_config.get("user_email")
        department = identity_config.get("department")

        # Fallback: OS username (FR-22)
        if not user_id:
            username = getpass.getuser()
            user_id = username

        if not user_email:
            # Try to construct from OS
            user_email = f"{getpass.getuser()}@{platform.node()}"

        if not department:
            department = "Unknown"

        device_id = self._get_device_id()

        return {
            "user_id": user_id,
            "user_email": user_email,
            "department": department,
            "device_id": device_id,
            "hostname": self._get_hostname(),
        }

    @property
    def user_id(self) -> str:
        """Get user ID."""
        return self._identity["user_id"]

    @property
    def user_email(self) -> str:
        """Get user email."""
        return self._identity["user_email"]

    @property
    def department(self) -> str:
        """Get department."""
        return self._identity["department"]

    @property
    def device_id(self) -> str:
        """Get device ID."""
        return self._identity["device_id"]

    @property
    def identity(self) -> Dict[str, str]:
        """Get full identity dict."""
        return self._identity.copy()

    def reload(self) -> None:
        """Reload identity from config."""
        self._identity = self._resolve_identity()


def get_identity(config_path: Optional[str] = None) -> IdentityResolver:
    """Get identity resolver instance.

    Args:
        config_path: Optional config file path

    Returns:
        IdentityResolver instance
    """
    return IdentityResolver(config_path)


def get_current_user() -> Dict[str, str]:
    """Get the currently active console user.

    Caches result for 30 seconds to avoid repeated subprocess/syscall overhead.
    Falls back gracefully through multiple resolution methods.

    Returns:
        Dict with keys: "username" (str), "source" (str describing resolution method)
    """
    global _cached_user, _cache_time

    now = time.time()
    if _cached_user is not None and (now - _cache_time) < _USER_CACHE_TTL:
        return _cached_user

    result = _resolve_current_user()

    _cached_user = result
    _cache_time = now
    return result


def _resolve_current_user() -> Dict[str, str]:
    """Resolve current user using platform-specific methods.

    Returns:
        Dict with "username" and "source" keys
    """
    system = platform.system()

    if system == "Windows":
        return _get_windows_user()
    elif system == "Darwin":
        return _get_macos_user()
    else:
        return _get_linux_user()


def _get_windows_user() -> Dict[str, str]:
    """Resolve active console session user on Windows.

    Tries WTS API for service-context compatibility, falls back to os.getlogin().

    Returns:
        Dict with "username" and "source"
    """
    # Try WTS API (works in service context)
    try:
        import ctypes
        import ctypes.wintypes

        wtsapi = ctypes.windll.wtsapi32
        kernel32 = ctypes.windll.kernel32

        WTS_CURRENT_SERVER_HANDLE = None
        WTSUserName = 5  # WTSInfoClass enum value

        # Get active console session ID
        session_id = kernel32.WTSGetActiveConsoleSessionId()

        buf = ctypes.c_wchar_p()
        buf_size = ctypes.c_ulong()

        success = wtsapi.WTSQuerySessionInformationW(
            WTS_CURRENT_SERVER_HANDLE,
            session_id,
            WTSUserName,
            ctypes.byref(buf),
            ctypes.byref(buf_size),
        )

        if success and buf.value:
            username = buf.value
            wtsapi.WTSFreeMemory(buf)
            if username:
                return {"username": username, "source": "wts"}
    except Exception:
        pass

    # Fallback: os.getlogin()
    try:
        username = os.getlogin()
        return {"username": username, "source": "os.getlogin"}
    except OSError:
        pass

    # Final fallback: getpass
    try:
        username = getpass.getuser()
        return {"username": username, "source": "getpass"}
    except Exception:
        pass

    return {"username": "unknown", "source": "fallback"}


def _get_macos_user() -> Dict[str, str]:
    """Resolve active console user on macOS.

    Parses `who` output to find the console session user.

    Returns:
        Dict with "username" and "source"
    """
    try:
        result = subprocess.run(
            ["who"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            # Parse first line: username  console  ...
            first_line = result.stdout.strip().splitlines()[0]
            parts = first_line.split()
            if parts:
                return {"username": parts[0], "source": "who"}
    except Exception:
        pass

    # Fallback
    try:
        username = getpass.getuser()
        return {"username": username, "source": "getpass"}
    except Exception:
        pass

    return {"username": "unknown", "source": "fallback"}


def _get_linux_user() -> Dict[str, str]:
    """Resolve active console user on Linux.

    Parses `who` output looking for local display (:0, tty1) entries.

    Returns:
        Dict with "username" and "source"
    """
    try:
        result = subprocess.run(
            ["who"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().splitlines()
            # Look for local display session first
            for line in lines:
                parts = line.split()
                if len(parts) >= 2:
                    # Check for local display indicators
                    line_str = " ".join(parts)
                    if "(:0)" in line_str or "(tty1)" in line_str or ":0" in line_str:
                        return {"username": parts[0], "source": "who-display"}

            # Fallback: first line of who output
            parts = lines[0].split()
            if parts:
                return {"username": parts[0], "source": "who"}
    except Exception:
        pass

    # Fallback
    try:
        username = getpass.getuser()
        return {"username": username, "source": "getpass"}
    except Exception:
        pass

    return {"username": "unknown", "source": "fallback"}
