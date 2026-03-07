"""Tamper detection for Devise Desktop Agent binary integrity (FR-28)."""

import hashlib
import sys
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class TamperResult:
    """Result of a tamper integrity check.

    Attributes:
        ok: True if binary matches trusted hash (or first run)
        actual_hash: SHA-256 hash of current binary
        expected_hash: Trusted hash from storage (None if unavailable)
        message: Human-readable status message
    """

    ok: bool
    actual_hash: str
    expected_hash: Optional[str]
    message: str


class TamperGuard:
    """Detects tampering by comparing running binary SHA-256 hash.

    On first run (no trusted hash stored), stores current hash as trusted.
    Subsequent runs compare against stored trusted hash and alert on mismatch.
    """

    HASH_FILE = "binary_hash.txt"  # relative to package data dir

    def compute_hash(self, path: str) -> str:
        """Compute SHA-256 hash of a file.

        Args:
            path: File path to hash

        Returns:
            Hex string SHA-256 digest
        """
        sha256 = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                sha256.update(chunk)
        return sha256.hexdigest()

    def get_trusted_hash(self) -> Optional[str]:
        """Read trusted hash from keyring, with fallback to hash file.

        Returns:
            Trusted hash hex string or None if not stored
        """
        # Try keyring first
        try:
            import keyring

            val = keyring.get_password("devise-agent", "binary-hash")
            if val:
                return val
        except Exception:
            pass

        # Fallback to file
        hash_path = Path(__file__).parent / "data" / self.HASH_FILE
        if hash_path.exists():
            content = hash_path.read_text().strip()
            # Ignore placeholder text (empty or non-hex content)
            if (
                content
                and len(content) == 64
                and all(c in "0123456789abcdef" for c in content)
            ):
                return content

        return None

    def store_trusted_hash(self, hash_val: str) -> None:
        """Store trusted hash in keyring and hash file.

        Args:
            hash_val: SHA-256 hex string to store as trusted
        """
        # Store in keyring
        try:
            import keyring

            keyring.set_password("devise-agent", "binary-hash", hash_val)
        except Exception as e:
            logger.debug(f"Keyring store failed (non-fatal): {e}")

        # Store in file as fallback
        hash_path = Path(__file__).parent / "data" / self.HASH_FILE
        hash_path.parent.mkdir(parents=True, exist_ok=True)
        hash_path.write_text(hash_val)

    def check_integrity(self) -> TamperResult:
        """Check if running binary matches trusted hash.

        On first run (no trusted hash), stores current hash as trusted.

        Returns:
            TamperResult with ok=True if binary is trusted, ok=False if tampered
        """
        try:
            actual = self.compute_hash(sys.executable)
        except Exception as e:
            logger.warning(f"Failed to hash binary: {e}")
            return TamperResult(
                ok=True,
                actual_hash="",
                expected_hash=None,
                message=f"Hash computation failed (skipping check): {e}",
            )

        expected = self.get_trusted_hash()

        if expected is None:
            # First run — store hash as trusted
            self.store_trusted_hash(actual)
            logger.info("TamperGuard: First run — hash stored as trusted")
            return TamperResult(
                ok=True,
                actual_hash=actual,
                expected_hash=actual,
                message="First run: hash stored as trusted",
            )

        if actual == expected:
            return TamperResult(
                ok=True,
                actual_hash=actual,
                expected_hash=expected,
                message="Binary integrity verified",
            )

        logger.error(
            f"TAMPER DETECTED: binary hash mismatch! "
            f"expected={expected[:16]}... actual={actual[:16]}..."
        )
        return TamperResult(
            ok=False,
            actual_hash=actual,
            expected_hash=expected,
            message=f"TAMPER DETECTED: hash mismatch",
        )
