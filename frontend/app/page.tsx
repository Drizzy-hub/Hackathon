"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageUploader from "./components/ImageUploader";
import LanguageSelector from "./components/LanguageSelector";
import DescriptionPanel from "./components/DescriptionPanel";
import AudioPlayer from "./components/AudioPlayer";
import QuestionInput from "./components/QuestionInput";
import EvidencePanel from "./components/EvidencePanel";
import { analyzeImage, ApiError, synthesizeSpeech } from "./lib/api";
import { AnalyzeResponse, AskResponse, Language } from "./lib/types";

type Stage = "perceive" | "rank" | "describe" | "speak";
const STAGES: { id: Stage; label: string }[] = [
  { id: "perceive", label: "Perceive" },
  { id: "rank", label: "Rank" },
  { id: "describe", label: "Describe" },
  { id: "speak", label: "Speak" },
];

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAnswer, setLastAnswer] = useState<AskResponse | null>(null);

  const previewUrlRef = useRef<string | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const runAnalysis = useCallback(
    async (image: File, lang: Language) => {
      setIsAnalyzing(true);
      setError(null);
      setStatus(null);
      setLastAnswer(null);
      try {
        const resp = await analyzeImage(image, lang);
        setAnalysis(resp);
        setStatus("Description ready.");
        if (resp.audio_available) {
          setIsSynthesizing(true);
          try {
            const blob = await synthesizeSpeech(resp.description, lang);
            const url = URL.createObjectURL(blob);
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = url;
            setAudioUrl(url);
          } catch (err) {
            const msg = err instanceof ApiError ? err.message : "Audio synthesis failed.";
            setError(`Description ready, but audio failed: ${msg}`);
          } finally {
            setIsSynthesizing(false);
          }
        } else {
          setStatus("Description ready. Audio is not configured on the backend.");
        }
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Analysis failed.";
        setError(msg);
        setAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  const onImageSelected = useCallback(
    (f: File) => {
      setFile(f);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(f);
      previewUrlRef.current = url;
      setPreviewUrl(url);
      void runAnalysis(f, language);
    },
    [language, runAnalysis],
  );

  const onLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      if (file) void runAnalysis(file, lang);
    },
    [file, runAnalysis],
  );

  // Pipeline stage state — purely visual
  const stageState = useMemo<Record<Stage, "idle" | "active" | "done">>(() => {
    if (!file && !analysis) {
      return { perceive: "idle", rank: "idle", describe: "idle", speak: "idle" };
    }
    if (isAnalyzing) {
      return { perceive: "active", rank: "active", describe: "active", speak: "idle" };
    }
    if (isSynthesizing) {
      return { perceive: "done", rank: "done", describe: "done", speak: "active" };
    }
    if (analysis) {
      return {
        perceive: "done",
        rank: "done",
        describe: "done",
        speak: audioUrl ? "done" : "idle",
      };
    }
    return { perceive: "idle", rank: "idle", describe: "idle", speak: "idle" };
  }, [file, analysis, isAnalyzing, isSynthesizing, audioUrl]);

  return (
    <main id="main" className="relative min-h-screen">
      {/* Hero gradient mesh backdrop */}
      <div
        aria-hidden
        className="see-hero-mesh pointer-events-none absolute inset-x-0 top-0 h-[520px] -z-10"
      />

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Hero */}
        <header className="see-fade-in mb-10">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="see-chip">
              <span className="see-stage-dot inline-block h-2 w-2 rounded-full bg-coral" aria-hidden />
              Hackathon MVP
            </span>
            <span className="see-chip text-amber">
              <span className="inline-block h-2 w-2 rounded-full bg-amber" aria-hidden />
              Not for safety-critical use
            </span>
          </div>

          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink md:text-6xl">
            See the details.{" "}
            <span className="italic text-forest">Hear</span> the story.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">
            SeeLess turns any image into a ranked, spoken description in your language — and
            answers your follow-up questions from the same evidence.
          </p>

          {/* Pipeline */}
          <div className="mt-7 see-pipeline" role="list" aria-label="Processing pipeline">
            {STAGES.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-2">
                <div
                  role="listitem"
                  data-state={stageState[stage.id]}
                  className="see-stage"
                  aria-label={`${stage.label}: ${stageState[stage.id]}`}
                >
                  <span className="see-stage__dot" aria-hidden />
                  <span>{stage.label}</span>
                </div>
                {i < STAGES.length - 1 && (
                  <span className="see-stage__arrow" aria-hidden>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </header>

        {/* Controls */}
        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
              Language
            </label>
            <LanguageSelector value={language} onChange={onLanguageChange} disabled={isAnalyzing} />
          </div>
        </section>

        {/* Uploader */}
        <section className="see-fade-in mb-6">
          <ImageUploader
            onImageSelected={onImageSelected}
            disabled={isAnalyzing}
            previewUrl={previewUrl}
          />
        </section>

        {/* Description + Audio */}
        <section className="grid gap-4 md:grid-cols-2">
          <DescriptionPanel
            description={analysis?.description ?? null}
            isAnalyzing={isAnalyzing}
            statusMessage={status}
            error={error}
          />
          <AudioPlayer
            audioUrl={audioUrl}
            label="Spoken description"
            disabled={isAnalyzing}
            isSynthesizing={isSynthesizing}
          />
        </section>

        {/* Q&A */}
        <section className="mt-6">
          <QuestionInput
            analysisId={analysis?.analysis_id ?? null}
            language={language}
            onAnswer={setLastAnswer}
            disabled={isAnalyzing}
          />
          {lastAnswer && (
            <div className="see-lift see-fade-in mt-3 rounded-feature border border-line-strong bg-surface p-5 shadow-card">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-coral" aria-hidden />
                <h3 className="text-base font-semibold text-ink">Answer</h3>
              </div>
              <p className="whitespace-pre-wrap text-ink">{lastAnswer.answer}</p>
              {lastAnswer.uncertainty && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber/10 p-2 text-sm text-amber">
                  <span aria-hidden>ℹ</span>
                  <span>{lastAnswer.uncertainty}</span>
                </p>
              )}
              {lastAnswer.supporting_evidence.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted">
                    Evidence
                  </span>
                  {lastAnswer.supporting_evidence.map((e, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-sage bg-sage/50 px-2.5 py-0.5 text-xs font-medium text-forest"
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Evidence */}
        <section className="mt-6">
          <EvidencePanel
            observations={analysis?.observations ?? null}
            ranked={analysis?.ranked_observations ?? null}
          />
        </section>

        <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-5 text-xs text-muted">
          <span>SeeLess · hackathon MVP</span>
          <span className="font-mono">Evidence → Ranking → Description → Speech</span>
        </footer>
      </div>
    </main>
  );
}
