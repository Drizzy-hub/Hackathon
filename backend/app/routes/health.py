from fastapi import APIRouter

from ..config import get_settings
from ..schemas.analysis import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    s = get_settings()
    return HealthResponse(
        status="ok",
        providers={
            "openai": bool(s.openai_api_key),
            "elevenlabs": bool(s.elevenlabs_api_key),
        },
    )
