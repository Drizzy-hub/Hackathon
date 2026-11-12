from typing import Dict, List, Literal, Optional, Tuple

from pydantic import BaseModel, ConfigDict, Field


Language = Literal["en", "fr", "es", "yo"]
EvidenceType = Literal["object", "attribute", "activity", "relationship", "visible_text"]
ObservationStatus = Literal["legible", "uncertain", "illegible", "clear", "partial"]
DetailLevel = Literal["brief", "standard", "full"]


class Observation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    entity: str
    value: str = ""
    evidence_type: EvidenceType
    source_region: Optional[Tuple[int, int, int, int]] = None
    status: ObservationStatus = "clear"
    importance: float = Field(default=0.5, ge=0.0, le=1.0)
    clarity: float = Field(default=0.7, ge=0.0, le=1.0)
    prominence: float = Field(default=0.5, ge=0.0, le=1.0)
    notes: Optional[str] = None


class StructuredObservations(BaseModel):
    model_config = ConfigDict(extra="ignore")

    scene_type: str = "unknown"
    summary: str = ""
    objects: List[Observation] = Field(default_factory=list)
    visible_text: List[Observation] = Field(default_factory=list)
    activities: List[Observation] = Field(default_factory=list)
    relationships: List[Observation] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)

    def all_observations(self) -> List[Observation]:
        return [
            *self.objects,
            *self.visible_text,
            *self.activities,
            *self.relationships,
        ]


class RankedObservation(Observation):
    score: float
    components: Dict[str, float]


class AnalyzeResponse(BaseModel):
    analysis_id: str
    language: Language
    description: str
    observations: StructuredObservations
    ranked_observations: List[RankedObservation]
    audio_available: bool


class AskRequest(BaseModel):
    analysis_id: str
    question: str
    language: Language = "en"


class AskResponse(BaseModel):
    answer: str
    language: Language
    supporting_evidence: List[str] = Field(default_factory=list)
    uncertainty: Optional[str] = None


class SynthesizeRequest(BaseModel):
    text: str
    language: Language = "en"
    voice_id: Optional[str] = None


class TranscribeResponse(BaseModel):
    text: str
    language: str


class HealthResponse(BaseModel):
    status: str
    providers: Dict[str, bool]
