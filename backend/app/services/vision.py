import base64
import json
import logging
from typing import Optional

from fastapi import HTTPException
from openai import AsyncOpenAI, APIError, APITimeoutError

from ..config import get_settings
from ..schemas.analysis import StructuredObservations

logger = logging.getLogger("seeless.vision")


_VISION_SYSTEM_PROMPT = """You are the perception module of an accessibility assistant for blind and low-vision users.
Analyze the image and return ONLY a JSON object matching this schema:

{
  "scene_type": string,            // short category, e.g. "university_notice", "menu", "street_scene", "product_label", "indoor_object"
  "summary": string,               // one short neutral sentence describing the scene
  "objects":        [Observation], // physical objects
  "visible_text":   [Observation], // legible or partially legible text actually visible in the image
  "activities":     [Observation], // actions / interactions happening in the scene
  "relationships":  [Observation], // spatial / referential relationships between entities
  "uncertainties":  [string]       // short notes about things that are unclear
}

Observation = {
  "entity":        string,  // what this is, e.g. "registration deadline", "red mug", "person waving"
  "value":         string,  // the content, text, or description. Empty string if not applicable.
  "evidence_type": "object" | "attribute" | "activity" | "relationship" | "visible_text",
  "status":        "legible" | "uncertain" | "illegible" | "clear" | "partial",
  "importance":    number,  // 0-1 estimated importance to a blind/low-vision user
  "clarity":       number,  // 0-1 how clearly this is visible
  "prominence":    number,  // 0-1 visual salience
  "notes":         string|null
}

Rules:
- Report ONLY what you can actually see. Do not guess at content outside the image.
- Transcribe visible text verbatim. If only partially legible, set status="partial" or "uncertain".
- NEVER invent bounding boxes. source_region is always omitted.
- Do not conflate inference with observation. Add uncertain inferences to "uncertainties".
- Prefer importance ~0.9 for actionable info (dates, places, prices, warnings), ~0.2 for decoration.
- Output JSON only. No prose. No markdown fences."""


async def analyze_image(
    image_bytes: bytes,
    mime_type: str,
    user_hint: Optional[str] = None,
) -> StructuredObservations:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")

    client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=settings.http_timeout_seconds)
    data_url = f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"

    user_parts = [
        {"type": "text", "text": user_hint or "Analyze this image for an accessibility description."},
        {"type": "image_url", "image_url": {"url": data_url}},
    ]

    try:
        response = await client.chat.completions.create(
            model=settings.openai_vision_model,
            messages=[
                {"role": "system", "content": _VISION_SYSTEM_PROMPT},
                {"role": "user", "content": user_parts},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
    except APITimeoutError as e:
        logger.warning("vision timeout: %s", e)
        raise HTTPException(status_code=504, detail="Vision model timed out") from e
    except APIError as e:
        logger.warning("vision api error: %s", e)
        raise HTTPException(status_code=502, detail="Vision provider error") from e

    raw = response.choices[0].message.content or "{}"
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        logger.warning("vision returned non-JSON payload")
        raise HTTPException(status_code=502, detail="Vision model returned invalid JSON") from e

    _sanitize_payload(payload)
    return StructuredObservations.model_validate(payload)


def _sanitize_payload(payload: dict) -> None:
    for bucket in ("objects", "visible_text", "activities", "relationships"):
        items = payload.get(bucket) or []
        if not isinstance(items, list):
            payload[bucket] = []
            continue
        for item in items:
            if isinstance(item, dict):
                item.pop("source_region", None)
