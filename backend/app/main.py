import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import analyze, health, questions, speech

logging.basicConfig(
    level=logging.INFO,
    format='{"level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}',
)

logger = logging.getLogger("seeless")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="SeeLess API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api/v1")
    app.include_router(analyze.router, prefix="/api/v1")
    app.include_router(questions.router, prefix="/api/v1")
    app.include_router(speech.router, prefix="/api/v1")

    logger.info(
        "providers openai=%s elevenlabs=%s",
        bool(settings.openai_api_key),
        bool(settings.elevenlabs_api_key),
    )
    return app


app = create_app()
