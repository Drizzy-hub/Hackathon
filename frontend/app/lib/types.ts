export type Language = "en" | "fr" | "es" | "yo";

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "fr", label: "French", native: "Français" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "yo", label: "Yoruba", native: "Yorùbá" },
];

export type EvidenceType =
  | "object"
  | "attribute"
  | "activity"
  | "relationship"
  | "visible_text";

export type ObservationStatus =
  | "legible"
  | "uncertain"
  | "illegible"
  | "clear"
  | "partial";

export interface Observation {
  entity: string;
  value: string;
  evidence_type: EvidenceType;
  source_region: [number, number, number, number] | null;
  status: ObservationStatus;
  importance: number;
  clarity: number;
  prominence: number;
  notes?: string | null;
}

export interface RankedObservation extends Observation {
  score: number;
  components: { I: number; C: number; R: number; P: number };
}

export interface StructuredObservations {
  scene_type: string;
  summary: string;
  objects: Observation[];
  visible_text: Observation[];
  activities: Observation[];
  relationships: Observation[];
  uncertainties: string[];
}

export interface AnalyzeResponse {
  analysis_id: string;
  language: Language;
  description: string;
  observations: StructuredObservations;
  ranked_observations: RankedObservation[];
  audio_available: boolean;
}

export interface AskResponse {
  answer: string;
  language: Language;
  supporting_evidence: string[];
  uncertainty: string | null;
}

export type DetailLevel = "brief" | "standard" | "full";
