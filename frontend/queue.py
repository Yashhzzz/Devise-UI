"""SQLite offline queue module for Devise Desktop Agent.

Provides persistent event buffering when backend is unreachable.
"""

import json
import logging
import os
import platform
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from queue import Queue
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Queue capacity
MAX_QUEUE_SIZE = 10000
BATCH_SIZE = 100

# Backoff intervals in seconds
BACKOFF_INTERVALS = [30, 60, 120, 300]
MAX_RETRIES = 4


def get_db_path() -> str:
    """Get platform-specific database path.

    Returns:
        Path to SQLite database file
    """
    if platform.system() == "Windows":
        base = os.environ.get("APPDATA", str(Path.home() / "AppData" / "Roaming"))
    elif platform.system() == "Darwin":
        base = str(Path.home() / "Library" / "Application Support")
    else:
        base = os.environ.get("XDG_DATA_HOME", str(Path.home() / ".local" / "share"))

    db_dir = Path(base) / "Devise"
    db_dir.mkdir(parents=True, exist_ok=True)

    return str(db_dir / "event_queue.db")


class EventQueue:
    """SQLite-backed event queue with FIFO overflow."""

    def __init__(self, db_path: Optional[str] = None):
        """Initialize event queue.

        Args:
            db_path: Optional custom database path
        """
        self._db_path = db_path or get_db_path()
        self._lock = threading.Lock()
        self._init_db()

    def _init_db(self) -> None:
        """Initialize database schema."""
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    retry_count INTEGER DEFAULT 0,
                    last_attempt TEXT,
                    status TEXT DEFAULT 'pending'
                )
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_events_status 
                ON events(status, created_at)
            """)

            conn.commit()
            conn.close()

        logger.info(f"Event queue initialized at {self._db_path}")

    def enqueue(self, event: Dict[str, Any]) -> bool:
        """Add event to queue.

        Args:
            event: Event dict to queue

        Returns:
            True if enqueued successfully
        """
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()

            # Check current size
            cursor.execute("SELECT COUNT(*) FROM events WHERE status = 'pending'")
            count = cursor.fetchone()[0]

            # If at capacity, drop oldest
            if count >= MAX_QUEUE_SIZE:
                cursor.execute(
                    """
                    DELETE FROM events 
                    WHERE id IN (
                        SELECT id FROM events 
                        WHERE status = 'pending' 
                        ORDER BY created_at ASC 
                        LIMIT ?
                    )
                """,
                    (count - MAX_QUEUE_SIZE + 1,),
                )
                logger.warning(f"Queue at capacity, dropped oldest events")

            # Insert new event
            event_json = json.dumps(event)
            created_at = datetime.now(timezone.utc).isoformat()

            cursor.execute(
                """
                INSERT INTO events (event_json, created_at, status)
                VALUES (?, ?, 'pending')
            """,
                (event_json, created_at),
            )

            conn.commit()
            conn.close()

        logger.debug(f"Event enqueued: {event.get('event_id', 'unknown')}")
        return True

    def get_pending(self, limit: int = BATCH_SIZE) -> List[Dict[str, Any]]:
        """Get pending events for sending.

        Args:
            limit: Maximum events to retrieve

        Returns:
            List of event dicts with id
        """
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT id, event_json, retry_count, created_at
                FROM events
                WHERE status = 'pending'
                AND (last_attempt IS NULL 
                     OR last_attempt < datetime('now', '-' || 
                        CASE retry_count
                            WHEN 0 THEN 30
                            WHEN 1 THEN 60
                            WHEN 2 THEN 120
                            WHEN 3 THEN 300
                            ELSE 300
                        END || ' seconds'))
                ORDER BY created_at ASC
                LIMIT ?
            """,
                (limit,),
            )

            rows = cursor.fetchall()
            conn.close()

            events = []
            for row in rows:
                event = json.loads(row[1])
                event["_queue_id"] = row[0]
                event["_retry_count"] = row[2]
                event["_created_at"] = row[3]
                events.append(event)

            return events

    def mark_success(self, queue_ids: List[int]) -> None:
        """Mark events as successfully sent.

        Args:
            queue_ids: List of queue IDs to mark as success
        """
        if not queue_ids:
            return

        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()

            placeholders = ",".join("?" * len(queue_ids))
            cursor.execute(
                f"""
                DELETE FROM events 
                WHERE id IN ({placeholders})
            """,
                queue_ids,
            )

            deleted = cursor.rowcount
            conn.commit()
            conn.close()

        logger.debug(f"Marked {deleted} events as successful")

    def mark_failed(self, queue_ids: List[int]) -> None:
        """Mark events as failed (increment retry count).

        Args:
            queue_ids: List of queue IDs to mark as failed
        """
        if not queue_ids:
            return

        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()

            now = datetime.now(timezone.utc).isoformat()

            for qid in queue_ids:
                cursor.execute(
                    """
                    UPDATE events
                    SET retry_count = retry_count + 1,
                        last_attempt = ?,
                        status = CASE 
                            WHEN retry_count + 1 >= ? THEN 'failed'
                            ELSE 'pending'
                        END
                    WHERE id = ?
                """,
                    (now, MAX_RETRIES, qid),
                )

            conn.commit()
            conn.close()

        logger.debug(f"Marked {len(queue_ids)} events as failed")

    def get_queue_depth(self) -> int:
        """Get current queue depth.

        Returns:
            Number of pending events
        """
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*) FROM events WHERE status = 'pending'
            """)

            count = cursor.fetchone()[0]
            conn.close()

            return count

    def get_failed_count(self) -> int:
        """Get count of events that exceeded max retries.

        Returns:
            Number of failed events
        """
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()

            cursor.execute("""
                SELECT COUNT(*) FROM events WHERE status = 'failed'
            """)

            count = cursor.fetchone()[0]
            conn.close()

            return count

    def clear_failed(self) -> int:
        """Clear all failed events.

        Returns:
            Number of events cleared
        """
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()

            cursor.execute("DELETE FROM events WHERE status = 'failed'")

            count = cursor.rowcount
            conn.commit()
            conn.close()

        logger.info(f"Cleared {count} failed events")
        return count

    def flush_all(self) -> None:
        """Clear all events (for testing)."""
        with self._lock:
            conn = sqlite3.connect(self._db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM events")
            conn.commit()
            conn.close()


def create_event_queue(
    db_path: Optional[str] = None,
    encrypted: bool = False,
    api_key: str = "",
    device_id: str = "",
) -> "EventQueue":
    """Create an event queue instance.

    Args:
        db_path: Optional custom database path
        encrypted: Use SQLCipher encryption (requires pysqlcipher3)
        api_key: API key for key derivation (used when encrypted=True)
        device_id: Device ID for key derivation (used when encrypted=True)

    Returns:
        EncryptedEventQueue if encrypted=True and pysqlcipher3 available,
        otherwise EventQueue
    """
    if encrypted:
        return EncryptedEventQueue(
            db_path=db_path, api_key=api_key, device_id=device_id
        )
    return EventQueue(db_path)


class EncryptedEventQueue(EventQueue):
    """SQLCipher-encrypted event queue.

    Uses pysqlcipher3 for AES-256-CBC encrypted SQLite storage.
    Gracefully falls back to plain EventQueue if pysqlcipher3 is unavailable.

    Key derivation: PBKDF2-HMAC-SHA256(api_key, device_id, 100000 iterations, 32 bytes)
    Key storage: OS credential store via keyring, with in-memory fallback.
    """

    def __init__(
        self,
        db_path: Optional[str] = None,
        api_key: str = "",
        device_id: str = "",
    ):
        """Initialize encrypted event queue.

        Args:
            db_path: Optional custom database path
            api_key: API key for key derivation
            device_id: Device ID for key derivation (salt)
        """
        self._api_key = api_key
        self._device_id = device_id
        self._encryption_available = self._check_encryption()
        self._derived_key: Optional[str] = None

        if not self._encryption_available:
            logger.warning(
                "pysqlcipher3 not available — falling back to unencrypted EventQueue"
            )

        super().__init__(db_path)

    def _check_encryption(self) -> bool:
        """Check if pysqlcipher3 is available.

        Returns:
            True if encryption is available
        """
        try:
            from pysqlcipher3 import dbapi2  # noqa: F401

            return True
        except ImportError:
            return False

    def _derive_key(self, api_key: str, device_id: str) -> str:
        """Derive encryption key from api_key and device_id.

        Uses PBKDF2-HMAC-SHA256 for key stretching.

        Args:
            api_key: API key (input key material)
            device_id: Device ID (salt)

        Returns:
            32-byte key as lowercase hex string
        """
        import hashlib

        key_bytes = hashlib.pbkdf2_hmac(
            "sha256",
            api_key.encode("utf-8"),
            device_id.encode("utf-8"),
            100000,
            dklen=32,
        )
        return key_bytes.hex()

    def _get_key(self) -> str:
        """Get or derive the encryption key.

        Attempts to load from keyring first, then derives from credentials.

        Returns:
            Hex-encoded 32-byte encryption key
        """
        # Try keyring first
        try:
            import keyring

            stored = keyring.get_password("devise-agent", "queue-key")
            if stored:
                return stored
        except Exception:
            pass

        # Derive key from credentials
        if self._derived_key is None:
            self._derived_key = self._derive_key(self._api_key, self._device_id)
            # Store in keyring for future use
            try:
                import keyring

                keyring.set_password("devise-agent", "queue-key", self._derived_key)
            except Exception:
                pass

        return self._derived_key

    def _get_connection(self) -> "sqlite3.Connection":
        """Get an encrypted database connection.

        Returns:
            SQLite connection with encryption PRAGMA applied,
            or plain sqlite3 connection if encryption unavailable
        """
        if not self._encryption_available:
            return sqlite3.connect(self._db_path)

        try:
            from pysqlcipher3 import dbapi2 as sqlite3_enc

            conn = sqlite3_enc.connect(self._db_path)
            hex_key = self._get_key()
            conn.execute(f"PRAGMA key = \"x'{hex_key}'\"")
            return conn
        except Exception as e:
            logger.warning(f"Encrypted connection failed, using plain sqlite3: {e}")
            return sqlite3.connect(self._db_path)

    def _init_db(self) -> None:
        """Initialize database schema with encrypted connection."""
        if not self._encryption_available:
            super()._init_db()
            return

        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    retry_count INTEGER DEFAULT 0,
                    last_attempt TEXT,
                    status TEXT DEFAULT 'pending'
                )
            """)

            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_events_status 
                ON events(status, created_at)
            """)

            conn.commit()
            conn.close()

        logger.info(f"Encrypted event queue initialized at {self._db_path}")

    def enqueue(self, event: Dict[str, Any]) -> bool:
        """Add event to encrypted queue."""
        if not self._encryption_available:
            return super().enqueue(event)

        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute("SELECT COUNT(*) FROM events WHERE status = 'pending'")
            count = cursor.fetchone()[0]

            if count >= MAX_QUEUE_SIZE:
                cursor.execute(
                    """
                    DELETE FROM events 
                    WHERE id IN (
                        SELECT id FROM events 
                        WHERE status = 'pending' 
                        ORDER BY created_at ASC 
                        LIMIT ?
                    )
                """,
                    (count - MAX_QUEUE_SIZE + 1,),
                )
                logger.warning("Encrypted queue at capacity, dropped oldest events")

            event_json = json.dumps(event)
            created_at = datetime.now(timezone.utc).isoformat()

            cursor.execute(
                """
                INSERT INTO events (event_json, created_at, status)
                VALUES (?, ?, 'pending')
            """,
                (event_json, created_at),
            )

            conn.commit()
            conn.close()

        logger.debug(f"Event enqueued (encrypted): {event.get('event_id', 'unknown')}")
        return True

    def get_pending(self, limit: int = BATCH_SIZE) -> List[Dict[str, Any]]:
        """Get pending events from encrypted queue."""
        if not self._encryption_available:
            return super().get_pending(limit)

        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()

            cursor.execute(
                """
                SELECT id, event_json, retry_count, created_at
                FROM events
                WHERE status = 'pending'
                AND (last_attempt IS NULL 
                     OR last_attempt < datetime('now', '-' || 
                        CASE retry_count
                            WHEN 0 THEN 30
                            WHEN 1 THEN 60
                            WHEN 2 THEN 120
                            WHEN 3 THEN 300
                            ELSE 300
                        END || ' seconds'))
                ORDER BY created_at ASC
                LIMIT ?
            """,
                (limit,),
            )

            rows = cursor.fetchall()
            conn.close()

            events = []
            for row in rows:
                event = json.loads(row[1])
                event["_queue_id"] = row[0]
                event["_retry_count"] = row[2]
                event["_created_at"] = row[3]
                events.append(event)

            return events

    def mark_success(self, queue_ids: List[int]) -> None:
        """Mark events as success in encrypted queue."""
        if not self._encryption_available:
            return super().mark_success(queue_ids)

        if not queue_ids:
            return

        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()

            placeholders = ",".join("?" * len(queue_ids))
            cursor.execute(
                f"DELETE FROM events WHERE id IN ({placeholders})",
                queue_ids,
            )

            conn.commit()
            conn.close()

    def mark_failed(self, queue_ids: List[int]) -> None:
        """Mark events as failed in encrypted queue."""
        if not self._encryption_available:
            return super().mark_failed(queue_ids)

        if not queue_ids:
            return

        with self._lock:
            conn = self._get_connection()
            cursor = conn.cursor()

            now = datetime.now(timezone.utc).isoformat()

            for qid in queue_ids:
                cursor.execute(
                    """
                    UPDATE events
                    SET retry_count = retry_count + 1,
                        last_attempt = ?,
                        status = CASE 
                            WHEN retry_count + 1 >= ? THEN 'failed'
                            ELSE 'pending'
                        END
                    WHERE id = ?
                """,
                    (now, MAX_RETRIES, qid),
                )

            conn.commit()
            conn.close()
