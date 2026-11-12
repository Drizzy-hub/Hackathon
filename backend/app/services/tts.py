import logging
from typing import AsyncIterator, Optional

import httpx
from fastapi import HTTPException

from ..config import get_settings
from ..schemas.analysis import Language

logger = logging.getLogger("seeless.tts")

_ELEVENLABS_BASE = "https://api.elevenlabs.io/v1"


async def synthesize(
    text: str,
    language: Language,
    voice_id: Optional[str] = None,
) -> AsyncIterator[bytes]:
    settings = get_settings()
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="ELEVENLABS_API_KEY is not configured")

    chosen_voice = voice_id or settings.voice_for_language(language)
    if not chosen_voice:
        raise HTTPException(
            status_code=503,
            detail=f"No ElevenLabs voice configured for language '{language}'",
        )

    url = f"{_ELEVENLABS_BASE}/text-to-speech/{chosen_voice}/stream"
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
    }
    body = {
        "text": text,
        "model_id": settings.elevenlabs_model,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.7,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }

    timeout = httpx.Timeout(settings.http_timeout_seconds, connect=15.0)
    client = httpx.AsyncClient(timeout=timeout)

    async def stream() -> AsyncIterator[bytes]:
        try:
            async with client.stream("POST", url, headers=headers, json=body) as resp:
                if resp.status_code >= 400:
                    detail = (await resp.aread()).decode("utf-8", errors="replace")
                    logger.warning("tts error %s: %s", resp.status_code, detail[:200])
                    raise HTTPException(
                        status_code=502,
                        detail=f"ElevenLabs returned {resp.status_code}",
                    )
                async for chunk in resp.aiter_bytes():
                    if chunk:
                        yield chunk
        finally:
            await client.aclose()

    return stream()
