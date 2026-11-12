import {
  AnalyzeResponse,
  AskResponse,
  DetailLevel,
  Language,
} from "./types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((d: { msg?: string; message?: string }) => d.msg ?? d.message ?? "")
        .filter(Boolean)
        .join("; ");
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText;
  }
}

export async function analyzeImage(
  image: File,
  language: Language,
  detail: DetailLevel = "standard",
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("image", image);
  form.append("language", language);
  form.append("detail", detail);

  const res = await fetch(`${BASE_URL}/api/v1/analyze`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json();
}

export async function askQuestion(
  analysisId: string,
  question: string,
  language: Language,
): Promise<AskResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      analysis_id: analysisId,
      question,
      language,
    }),
  });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json();
}

export async function synthesizeSpeech(
  text: string,
  language: Language,
): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/api/v1/speech/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.blob();
}

export async function transcribeAudio(
  audio: Blob,
  language?: Language,
): Promise<{ text: string; language: string }> {
  const form = new FormData();
  const filename =
    audio.type.includes("ogg")
      ? "audio.ogg"
      : audio.type.includes("wav")
        ? "audio.wav"
        : "audio.webm";
  form.append("audio", audio, filename);
  if (language) form.append("language", language);

  const res = await fetch(`${BASE_URL}/api/v1/speech/transcribe`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json();
}

export async function healthCheck(): Promise<{
  status: string;
  providers: Record<string, boolean>;
}> {
  const res = await fetch(`${BASE_URL}/api/v1/health`);
  if (!res.ok) throw new ApiError(await readError(res), res.status);
  return res.json();
}
