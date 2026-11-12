from functools import lru_cache
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    openai_vision_model: str = Field(default="gpt-4o", alias="OPENAI_VISION_MODEL")
    openai_qa_model: str = Field(default="gpt-4o", alias="OPENAI_QA_MODEL")
    openai_language_model: str = Field(default="gpt-4o-mini", alias="OPENAI_LANGUAGE_MODEL")
    openai_asr_model: str = Field(default="whisper-1", alias="OPENAI_ASR_MODEL")

    elevenlabs_api_key: Optional[str] = Field(default=None, alias="ELEVENLABS_API_KEY")
    elevenlabs_model: str = Field(default="eleven_v3", alias="ELEVENLABS_MODEL")
    elevenlabs_default_voice: Optional[str] = Field(default=None, alias="ELEVENLABS_DEFAULT_VOICE")
    elevenlabs_voice_en: Optional[str] = Field(default=None, alias="ELEVENLABS_VOICE_EN")
    elevenlabs_voice_fr: Optional[str] = Field(default=None, alias="ELEVENLABS_VOICE_FR")
    elevenlabs_voice_es: Optional[str] = Field(default=None, alias="ELEVENLABS_VOICE_ES")
    elevenlabs_voice_yo: Optional[str] = Field(default=None, alias="ELEVENLABS_VOICE_YO")

    session_ttl_seconds: int = Field(default=900, alias="SESSION_TTL_SECONDS")
    max_image_bytes: int = Field(default=10 * 1024 * 1024, alias="MAX_IMAGE_BYTES")
    http_timeout_seconds: float = Field(default=60.0, alias="HTTP_TIMEOUT_SECONDS")

    allowed_origins_raw: str = Field(
        default="http://localhost:3000", alias="ALLOWED_ORIGINS"
    )

    @property
    def allowed_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins_raw.split(",") if o.strip()]

    def voice_for_language(self, language: str) -> Optional[str]:
        mapping = {
            "en": self.elevenlabs_voice_en,
            "fr": self.elevenlabs_voice_fr,
            "es": self.elevenlabs_voice_es,
            "yo": self.elevenlabs_voice_yo,
        }
        return mapping.get(language) or self.elevenlabs_default_voice


@lru_cache
def get_settings() -> Settings:
    return Settings()
