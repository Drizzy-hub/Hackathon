import base64
import json
import logging
from typing import List

from fastapi import HTTPException
from openai import AsyncOpenAI, APIError, APITimeoutError

from ..config import get_settings
from ..schemas.analysis import (
    AskResponse,
    DetailLevel,
    Language,
    RankedObservation,
    StructuredObservations,
)

logger = logging.getLogger("seeless.language")


_LANGUAGE_NAMES = {
    "en": "English",
    "fr": "French (français)",
    "es": "Spanish (español)",
    "yo": "Yoruba (Yorùbá, with proper tone marks)",
}


_DETAIL_WORD_HINT = {
    "brief": "roughly 25-40 words",
    "standard": "roughly 60-90 words",
    "full": "roughly 110-160 words",
}


def _build_evidence_block(obs: StructuredObservations, ranked: List[RankedObservation]) -> str:
    compact = {
        "scene_type": obs.scene_type,
        "summary": obs.summary,
        "uncertainties": obs.uncertainties,
        "ranked": [
            {
                "rank": i + 1,
                "entity": r.entity,
                "value": r.value,
                "evidence_type": r.evidence_type,
                "status": r.status,
                "score": r.score,
            }
            for i, r in enumerate(ranked)
        ],
    }
    return json.dumps(compact, ensure_ascii=False)


async def generate_description(
    obs: StructuredObservations,
    ranked: List[RankedObservation],
    language: Language,
    detail: DetailLevel = "standard",
) -> str:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")

    client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=settings.http_timeout_seconds)

    system = f"""You write accessible, listening-friendly descriptions for blind and low-vision users.
Target language: {_LANGUAGE_NAMES[language]}.
Length: {_DETAIL_WORD_HINT.get(detail, _DETAIL_WORD_HINT['standard'])}.
Rules:
- Use ONLY facts from the provided evidence JSON. Do not add anything that is not in it.
- Communicate the most important ranked items first (lower rank = earlier).
- Preserve uncertainty: if an item has status "uncertain", "partial", or "illegible", say so plainly.
- For Yoruba, use correct tone marks (á, è, ẹ, ọ, ṣ, etc.).
- Natural spoken prose, no lists, no markdown, no emojis.
- Do NOT translate labels: if text appears in a specific language on the image, quote it in that language, then explain briefly in the target language.
- Output the description only, no preface."""

    user = f"Evidence JSON:\n{_build_evidence_block(obs, ranked)}"

    try:
        response = await client.chat.completions.create(
            model=settings.openai_language_model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.3,
        )
    except APITimeoutError as e:
        raise HTTPException(status_code=504, detail="Language model timed out") from e
    except APIError as e:
        raise HTTPException(status_code=502, detail="Language provider error") from e

    return (response.choices[0].message.content or "").strip()


_QA_SYSTEM_PROMPT = """You answer questions about an image for a blind or low-vision user.
You are given: (1) the original image, (2) a structured evidence JSON produced from it, and (3) the user's question.
Target language is specified below.

Rules:
- Answer ONLY using the image and the provided evidence. Do not invent details.
- If the evidence is insufficient or ambiguous, say so explicitly and name what is missing.
- Keep the answer short, conversational, and spoken-friendly.
- Return a strict JSON object:
  {
    "answer": string,               // the spoken-friendly answer in the target language
    "supporting_evidence": [string],// list of entity names from the evidence that support the answer
    "uncertainty": string|null      // short note if confidence is limited, else null
  }
- Output JSON only. No markdown fences."""


async def answer_question(
    image_bytes: bytes,
    mime_type: str,
    obs: StructuredObservations,
    question: str,
    language: Language,
) -> AskResponse:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")

    client = AsyncOpenAI(api_key=settings.openai_api_key, timeout=settings.http_timeout_seconds)
    data_url = f"data:{mime_type};base64,{base64.b64encode(image_bytes).decode('ascii')}"

    evidence_json = obs.model_dump_json(exclude_none=True)
    user_prompt = (
        f"Target language: {_LANGUAGE_NAMES[language]}.\n"
        f"Question: {question}\n\n"
        f"Evidence JSON:\n{evidence_json}"
    )

    try:
        response = await client.chat.completions.create(
            model=settings.openai_qa_model,
            messages=[
                {"role": "system", "content": _QA_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
    except APITimeoutError as e:
        raise HTTPException(status_code=504, detail="QA model timed out") from e
    except APIError as e:
        raise HTTPException(status_code=502, detail="QA provider error") from e

    raw = response.choices[0].message.content or "{}"
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail="QA model returned invalid JSON") from e

    return AskResponse(
        answer=str(payload.get("answer", "")).strip(),
        language=language,
        supporting_evidence=list(payload.get("supporting_evidence") or []),
        uncertainty=(payload.get("uncertainty") or None),
    )
