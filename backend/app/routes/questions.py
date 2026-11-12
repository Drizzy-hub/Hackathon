from fastapi import APIRouter, HTTPException

from ..config import get_settings
from ..schemas.analysis import AskRequest, AskResponse
from ..services import language as language_service
from ..session_store import get_session_store

router = APIRouter(tags=["questions"])


@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest) -> AskResponse:
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Empty question")

    settings = get_settings()
    store = get_session_store(settings.session_ttl_seconds)
    entry = store.get(req.analysis_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Unknown or expired analysis_id")

    return await language_service.answer_question(
        image_bytes=entry.image_bytes,
        mime_type=entry.mime_type,
        obs=entry.observations,
        question=req.question,
        language=req.language,
    )
