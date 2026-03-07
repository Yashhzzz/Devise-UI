"""Process resolution module for Devise Desktop Agent.

Provides detailed process attribution including executable path and
I/O counter estimation (FR-11). Note: io_counters() returns disk I/O bytes,
not network bytes — used as a proxy for process activity.
"""

import logging
import psutil
from dataclasses import dataclass, field
from typing import Tuple, Optional, Dict

logger = logging.getLogger(__name__)


@dataclass
class ProcessInfo:
    """Resolved process information.

    Attributes:
        name: Process name (e.g., "chrome.exe")
        path: Full executable path or empty string if unavailable
        pid: Process ID
        bytes_read: Disk bytes read by process (proxy for activity; None if unavailable)
        bytes_write: Disk bytes written by process (proxy for activity; None if unavailable)
    """

    name: str
    path: str
    pid: int
    bytes_read: Optional[int] = None
    bytes_write: Optional[int] = None


# Mapping of process names to human-readable labels
PROCESS_NAME_MAPPING: Dict[str, str] = {
    "python.exe": "Python",
    "python3.exe": "Python",
    "python": "Python",
    "python3": "Python",
    "node.exe": "Node.js",
    "node": "Node.js",
    "chrome.exe": "Google Chrome",
    "msedge.exe": "Microsoft Edge",
    "firefox.exe": "Mozilla Firefox",
    "safari": "Safari",
    "code.exe": "Visual Studio Code",
    "cursor.exe": "Cursor IDE",
    "slack.exe": "Slack",
    "teams.exe": "Microsoft Teams",
    "zoom.exe": "Zoom",
    "discord.exe": "Discord",
    "postman.exe": "Postman",
    "curl.exe": "cURL",
    "wget.exe": "Wget",
    "git.exe": "Git",
    "powershell.exe": "PowerShell",
    "cmd.exe": "Command Prompt",
    "explorer.exe": "Windows Explorer",
    "brave.exe": "Brave Browser",
    "opera.exe": "Opera",
    "vivaldi.exe": "Vivaldi",
    "spotify.exe": "Spotify",
    "slack": "Slack",
    "teams": "Microsoft Teams",
    "zoom": "Zoom",
    "code": "Visual Studio Code",
    "cursor": "Cursor IDE",
    "chrome": "Google Chrome",
    "firefox": "Mozilla Firefox",
    "msedge": "Microsoft Edge",
    "Safari": "Safari",
    "postman": "Postman",
    "git": "Git",
    "docker.exe": "Docker Desktop",
    "docker": "Docker Desktop",
    "idea.exe": "IntelliJ IDEA",
    "idea64.exe": "IntelliJ IDEA",
    "pycharm64.exe": "PyCharm",
    "pycharm": "PyCharm",
    "webstorm64.exe": "WebStorm",
    "rider64.exe": "Rider",
    "goland64.exe": "GoLand",
    "datagrip64.exe": "DataGrip",
}


def get_human_readable_name(process_name: str) -> str:
    """Get human-readable name for a process.

    Args:
        process_name: Short process name (e.g., "python.exe")

    Returns:
        Human-readable name or original if not found in mapping
    """
    return PROCESS_NAME_MAPPING.get(process_name, process_name)


class ProcessResolver:
    """Resolves process information from PID."""

    def __init__(self):
        """Initialize process resolver."""
        self._cache: Dict[int, Tuple[str, str]] = {}
        self._cache_max_size = 1000

    def resolve(self, pid: int) -> Tuple[str, str, int]:
        """Resolve process name and executable path from PID.

        Args:
            pid: Process ID

        Returns:
            Tuple of (process_name, process_path, pid)
            process_path is empty string if unavailable
        """
        # Check cache first
        if pid in self._cache:
            name, path = self._cache[pid]
            return name, path, pid

        process_name = "unknown"
        process_path = None

        try:
            process = psutil.Process(pid)
            process_name = process.name()
            try:
                process_path = process.exe()
            except (psutil.AccessDenied, psutil.NoSuchProcess):
                # Can't get exe path - common for some system processes
                process_path = ""
            except Exception as e:
                logger.debug(f"Error getting exe for PID {pid}: {e}")
                process_path = ""

        except psutil.NoSuchProcess:
            logger.debug(f"Process {pid} not found (terminated)")
            process_name = "unknown"
            process_path = ""

        except psutil.AccessDenied:
            logger.debug(f"Access denied for process {pid}")
            process_name = "unknown"
            process_path = ""

        except Exception as e:
            logger.warning(f"Error resolving process {pid}: {e}")
            process_name = "unknown"
            process_path = ""

        # Cache the result (store as string, use empty string for None)
        if len(self._cache) < self._cache_max_size:
            self._cache[pid] = (process_name, process_path)

        return process_name, process_path, pid

    def resolve_with_io(self, pid: int) -> ProcessInfo:
        """Resolve process info including I/O counters.

        I/O counters represent disk bytes (not network) — used as a proxy
        for process activity level. Returns None for bytes fields if the OS
        denies access or the process no longer exists.

        Args:
            pid: Process ID

        Returns:
            ProcessInfo dataclass with name, path, pid, and optional I/O bytes
        """
        process_name, process_path, pid = self.resolve(pid)
        bytes_read: Optional[int] = None
        bytes_write: Optional[int] = None

        try:
            proc = psutil.Process(pid)
            io = proc.io_counters()
            bytes_read = io.read_bytes
            bytes_write = io.write_bytes
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            pass
        except AttributeError:
            # io_counters() not available on all platforms
            pass
        except Exception as e:
            logger.debug(f"IO counter error for PID {pid}: {e}")

        return ProcessInfo(
            name=process_name,
            path=process_path,
            pid=pid,
            bytes_read=bytes_read,
            bytes_write=bytes_write,
        )

    def resolve_name_only(self, pid: int) -> str:
        """Resolve just the process name.

        Args:
            pid: Process ID

        Returns:
            Process name or "unknown"
        """
        name, _, _ = self.resolve(pid)
        return name

    def resolve_path_only(self, pid: int) -> Optional[str]:
        """Resolve just the process executable path.

        Args:
            pid: Process ID

        Returns:
            Process path or None
        """
        _, path, _ = self.resolve(pid)
        return path

    def clear_cache(self) -> None:
        """Clear the process resolution cache."""
        self._cache.clear()


def create_process_resolver() -> ProcessResolver:
    """Create a process resolver instance.

    Returns:
        ProcessResolver instance
    """
    return ProcessResolver()
