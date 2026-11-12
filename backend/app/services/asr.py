import io
import logging
from typing import Optional

from fastapi import HTTPException
from openai import AsyncOpenAI, APIError, APITimeoutError

from ..config import get_settings

logger = logging.getLogger("seeless.asr")


async def transcribe(
    audio_bytes: bytes,
    filename: str,
    mime_type: str,
    language: Optional[str] = None,
) -> dict:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")

    client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=settings.http_timeout_seconds)
    buf = io.BytesIO(audio_bytes)
    buf.name = filename or "audio.webm"

    kwargs: dict = {
        "model": settings.openai_asr_model,
        "file": buf,
    }
    if language:
        kwargs["language"] = language

    try:
        result = await client.audio.transcriptions.create(**kwargs)
    except APITimeoutError as e:
        raise HTTPException(status_code=504, detail="ASR timed out") from e
    except APIError as e:
        raise HTTPException(status_code=502, detail="ASR provider error") from e

    text = getattr(result, "text", "") or ""
    detected = getattr(result, "language", None) or language or ""
    return {"text": text.strip(), "language": detected}
