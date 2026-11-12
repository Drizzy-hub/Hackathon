import re
from typing import Dict, List, Optional

from ..schemas.analysis import Observation, RankedObservation, StructuredObservations


DEFAULT_WEIGHTS: Dict[str, float] = {"I": 0.4, "C": 0.2, "R": 0.3, "P": 0.1}

_STATUS_CLARITY_PENALTY = {
    "legible": 1.0,
    "clear": 1.0,
    "partial": 0.6,
    "uncertain": 0.4,
    "illegible": 0.1,
}

_SCENE_KEYWORDS: Dict[str, List[str]] = {
    "university_notice": ["deadline", "date", "time", "location", "room", "venue", "contact", "register", "registration", "fee", "email", "phone"],
    "menu": ["price", "dish", "allergen", "vegetarian", "vegan", "spicy", "special"],
    "product_label": ["ingredient", "allergen", "warning", "expiry", "best before", "dose", "dosage"],
    "street_scene": ["sign", "crosswalk", "traffic", "entrance", "exit", "direction"],
    "indoor_object": ["label", "button", "switch", "handle"],
}


def _text_relevance(text: str, keywords: List[str]) -> float:
    if not text or not keywords:
        return 0.0
    hay = text.lower()
    hits = sum(1 for kw in keywords if kw in hay)
    return min(1.0, hits / 3.0)


def _question_overlap(obs_text: str, question: str) -> float:
    if not question:
        return 0.0
    tokens = {t for t in re.findall(r"[a-zA-Z0-9']+", question.lower()) if len(t) > 2}
    if not tokens:
        return 0.0
    hay_tokens = set(re.findall(r"[a-zA-Z0-9']+", obs_text.lower()))
    hits = len(tokens & hay_tokens)
    return min(1.0, hits / max(1, len(tokens)))


def _relevance(obs: Observation, scene_type: str, user_question: Optional[str]) -> float:
    kw = _SCENE_KEYWORDS.get(scene_type, [])
    text = f"{obs.entity} {obs.value}".strip()
    base = _text_relevance(text, kw)
    q = _question_overlap(text, user_question or "")
    # visible text is usually what a user with low vision needs most
    text_bias = 0.25 if obs.evidence_type == "visible_text" else 0.0
    return min(1.0, base + q + text_bias)


def _clarity(obs: Observation) -> float:
    base = obs.clarity
    penalty = _STATUS_CLARITY_PENALTY.get(obs.status, 0.7)
    return max(0.0, min(1.0, base * penalty))


def rank_observations(
    obs: StructuredObservations,
    user_question: Optional[str] = None,
    weights: Optional[Dict[str, float]] = None,
) -> List[RankedObservation]:
    w = {**DEFAULT_WEIGHTS, **(weights or {})}
    ranked: List[RankedObservation] = []
    for item in obs.all_observations():
        i = max(0.0, min(1.0, item.importance))
        c = _clarity(item)
        r = _relevance(item, obs.scene_type, user_question)
        p = max(0.0, min(1.0, item.prominence))
        contributions = {
            "I": w["I"] * i,
            "C": w["C"] * c,
            "R": w["R"] * r,
            "P": w["P"] * p,
        }
        score = sum(contributions.values())
        ranked.append(
            RankedObservation(
                **item.model_dump(),
                score=round(score, 4),
                components={k: round(v, 4) for k, v in contributions.items()},
            )
        )
    ranked.sort(key=lambda x: x.score, reverse=True)
    return ranked
