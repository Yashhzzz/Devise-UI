"""AI Tools Registry module for Devise Desktop Agent."""

import json
import logging
import os
from typing import List, Dict, Optional, Any
from pathlib import Path
import httpx


logger = logging.getLogger(__name__)


class RegistryEntry:
    """Represents a single AI tool in the registry."""

    def __init__(self, data: Dict[str, Any]):
        """Initialize registry entry.

        Args:
            data: Entry data from registry
        """
        self.domain = data.get("domain", "")
        self.tool_name = data.get("tool_name", "")
        self.category = data.get("category", "unknown")
        self.vendor = data.get("vendor", "unknown")
        self.risk_level = data.get("risk_level", "medium")
        self.enterprise_flag = data.get("enterprise_flag", False)
        self.api_domain_flag = data.get("api_domain_flag", False)

    def matches(self, hostname: str) -> bool:
        """Check if hostname matches this entry.

        Args:
            hostname: Hostname to check

        Returns:
            True if hostname matches
        """
        if not hostname or not self.domain:
            return False

        hostname_lower = hostname.lower()
        domain_lower = self.domain.lower()

        # Exact match
        if hostname_lower == domain_lower:
            return True

        # Wildcard match (subdomain)
        if hostname_lower.endswith("." + domain_lower):
            return True

        return False

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary.

        Returns:
            Dict representation
        """
        return {
            "domain": self.domain,
            "tool_name": self.tool_name,
            "category": self.category,
            "vendor": self.vendor,
            "risk_level": self.risk_level,
            "enterprise_flag": self.enterprise_flag,
            "api_domain_flag": self.api_domain_flag,
        }


class Registry:
    """AI Tools Registry with matching and update support."""

    def __init__(
        self, registry_path: Optional[str] = None, update_url: Optional[str] = None
    ):
        """Initialize registry.

        Args:
            registry_path: Path to bundled registry JSON
            update_url: URL to check for registry updates
        """
        self._entries: List[RegistryEntry] = []
        self._update_url = update_url
        self._load_registry(registry_path)

    def _load_registry(self, registry_path: Optional[str]) -> None:
        """Load registry from bundled file.

        Args:
            registry_path: Path to registry file
        """
        if registry_path is None:
            # Default to bundled registry
            registry_path = self._get_default_registry_path()

        if os.path.exists(registry_path):
            try:
                with open(registry_path, "r") as f:
                    data = json.load(f)

                tools = data.get("tools", [])
                self._entries = [RegistryEntry(t) for t in tools]
                logger.info(f"Loaded {len(self._entries)} entries from registry")

            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Failed to load registry: {e}")
                self._entries = []
        else:
            logger.warning(f"Registry file not found: {registry_path}")
            self._entries = []

    def _get_default_registry_path(self) -> str:
        """Get default bundled registry path."""
        # Relative to this module
        module_dir = Path(__file__).parent
        return str(module_dir / "data" / "ai_tools_registry.json")

    async def check_for_updates(self) -> bool:
        """Check for registry updates from backend.

        Returns:
            True if updates were applied
        """
        if not self._update_url:
            return False

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(self._update_url)
                response.raise_for_status()

                data = response.json()
                new_entries = [RegistryEntry(t) for t in data.get("tools", [])]

                if new_entries:
                    self._entries = new_entries
                    logger.info(f"Updated registry with {len(new_entries)} entries")
                    return True

        except Exception as e:
            logger.warning(f"Failed to check for registry updates: {e}")

        return False

    def find_match(self, hostname: str) -> Optional[RegistryEntry]:
        """Find registry entry matching hostname.

        Args:
            hostname: Hostname to match

        Returns:
            Matching RegistryEntry or None
        """
        for entry in self._entries:
            if entry.matches(hostname):
                return entry
        return None

    def find_all_matches(self, hostname: str) -> List[RegistryEntry]:
        """Find all registry entries matching hostname.

        Args:
            hostname: Hostname to match

        Returns:
            List of matching entries
        """
        matches = []
        for entry in self._entries:
            if entry.matches(hostname):
                matches.append(entry)
        return matches

    @property
    def entries(self) -> List[RegistryEntry]:
        """Get all registry entries."""
        return self._entries

    @property
    def entry_count(self) -> int:
        """Get number of entries."""
        return len(self._entries)

    def get_tools_by_category(self, category: str) -> List[RegistryEntry]:
        """Get entries by category.

        Args:
            category: Category to filter by

        Returns:
            List of entries in category
        """
        return [e for e in self._entries if e.category == category]

    def get_tools_by_vendor(self, vendor: str) -> List[RegistryEntry]:
        """Get entries by vendor.

        Args:
            vendor: Vendor to filter by

        Returns:
            List of entries from vendor
        """
        return [e for e in self._entries if e.vendor == vendor]


def create_registry(
    registry_path: Optional[str] = None, update_url: Optional[str] = None
) -> Registry:
    """Create a registry instance.

    Args:
        registry_path: Path to bundled registry
        update_url: URL for registry updates

    Returns:
        Registry instance
    """
    return Registry(registry_path, update_url)
