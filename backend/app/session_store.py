import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Dict, Optional

from .schemas.analysis import Language, StructuredObservations


@dataclass
class SessionEntry:
    image_bytes: bytes
    mime_type: str
    observations: StructuredObservations
    language: Language
    created_at: float = field(default_factory=time.time)


class SessionStore:
    def __init__(self, ttl_seconds: int) -> None:
        self._ttl = ttl_seconds
        self._lock = threading.RLock()
        self._entries: Dict[str, SessionEntry] = {}

    def _is_expired(self, entry: SessionEntry) -> bool:
        return (time.time() - entry.created_at) > self._ttl

    def _evict_expired_locked(self) -> None:
        expired = [k for k, v in self._entries.items() if self._is_expired(v)]
        for k in expired:
            self._entries.pop(k, None)

    def put(
        self,
        image_bytes: bytes,
        mime_type: str,
        observations: StructuredObservations,
        language: Language,
    ) -> str:
        analysis_id = f"analysis_{uuid.uuid4().hex[:16]}"
        with self._lock:
            self._evict_expired_locked()
            self._entries[analysis_id] = SessionEntry(
                image_bytes=image_bytes,
                mime_type=mime_type,
                observations=observations,
                language=language,
            )
        return analysis_id

    def get(self, analysis_id: str) -> Optional[SessionEntry]:
        with self._lock:
            entry = self._entries.get(analysis_id)
            if entry is None:
                return None
            if self._is_expired(entry):
                self._entries.pop(analysis_id, None)
                return None
            return entry

    def delete(self, analysis_id: str) -> None:
        with self._lock:
            self._entries.pop(analysis_id, None)

    def size(self) -> int:
        with self._lock:
            self._evict_expired_locked()
            return len(self._entries)


_store: Optional[SessionStore] = None
_store_lock = threading.Lock()


def get_session_store(ttl_seconds: int) -> SessionStore:
    global _store
    if _store is None:
        with _store_lock:
            if _store is None:
                _store = SessionStore(ttl_seconds=ttl_seconds)
    return _store
