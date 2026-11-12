import logging
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from ..config import get_settings
from ..schemas.analysis import AnalyzeResponse, DetailLevel, Language
from ..services import language as language_service
from ..services import ranking, vision
from ..session_store import get_session_store

router = APIRouter(tags=["analyze"])
logger = logging.getLogger("seeless.analyze")

_ALLOWED_MIME = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"}
_ALLOWED_LANGUAGES = {"en", "fr", "es", "yo"}
_ALLOWED_DETAIL = {"brief", "standard", "full"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    image: UploadFile = File(...),
    language: str = Form(...),
    detail: Optional[str] = Form("standard"),
    hint: Optional[str] = Form(None),
) -> AnalyzeResponse:
    if language not in _ALLOWED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language '{language}'")
    detail_value = (detail or "standard").lower()
    if detail_value not in _ALLOWED_DETAIL:
        raise HTTPException(status_code=400, detail=f"Unsupported detail '{detail}'")

    mime_type = (image.content_type or "").lower()
    if mime_type not in _ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported image type '{mime_type}'")

    settings = get_settings()
    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty image")
    if len(image_bytes) > settings.max_image_bytes:
        raise HTTPException(status_code=413, detail="Image exceeds size limit")

    obs = await vision.analyze_image(image_bytes, mime_type, user_hint=hint)
    ranked = ranking.rank_observations(obs)
    description = await language_service.generate_description(
        obs, ranked, language=language, detail=detail_value  # type: ignore[arg-type]
    )

    store = get_session_store(settings.session_ttl_seconds)
    analysis_id = store.put(
        image_bytes=image_bytes,
        mime_type=mime_type,
        observations=obs,
        language=language,  # type: ignore[arg-type]
    )

    return AnalyzeResponse(
        analysis_id=analysis_id,
        language=language,  # type: ignore[arg-type]
        description=description,
        observations=obs,
        ranked_observations=ranked,
        audio_available=bool(settings.elevenlabs_api_key),
    )
