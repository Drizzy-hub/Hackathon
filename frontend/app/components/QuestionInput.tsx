"use client";

import { useRef, useState } from "react";
import { ApiError, askQuestion, transcribeAudio } from "../lib/api";
import { AskResponse, Language } from "../lib/types";

interface Props {
  analysisId: string | null;
  language: Language;
  onAnswer: (answer: AskResponse) => void;
  disabled?: boolean;
}

export default function QuestionInput({ analysisId, language, onAnswer, disabled }: Props) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const submit = async () => {
    if (!analysisId) {
      setSubmitError("Upload and analyze an image before asking a question.");
      return;
    }
    const q = text.trim();
    if (!q) {
      setSubmitError("Please type a question.");
      return;
    }
    setBusy(true);
    setSubmitError(null);
    try {
      const resp = await askQuestion(analysisId, q, language);
      onAnswer(resp);
      setText("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to send question.";
      setSubmitError(msg);
    } finally {
      setBusy(false);
    }
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        try {
          const { text: transcript } = await transcribeAudio(blob, language);
          setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        } catch (err) {
          const msg = err instanceof ApiError ? err.message : "Transcription failed.";
          setMicError(msg);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMicError("Microphone unavailable. Type your question instead.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  return (
    <section
      aria-labelledby="qa-heading"
      className="see-lift space-y-3 rounded-feature border border-line-strong bg-surface p-5 shadow-card"
    >
      <div className="flex items-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-coral" aria-hidden />
        <h2 id="qa-heading" className="text-base font-semibold text-ink">
          Ask a follow-up question
        </h2>
      </div>

      <label htmlFor="question-text" className="sr-only">
        Your question
      </label>
      <textarea
        id="question-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Example: What is the registration deadline?"
        disabled={disabled || busy}
        className="w-full rounded-input border border-line-strong bg-ivory/60 p-3 text-ink placeholder:text-muted/70 transition focus:bg-surface focus-visible:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={disabled || busy || !analysisId}
          className="min-h-[44px] rounded-input bg-forest px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-hover hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <span className="see-stage-dot inline-block h-2 w-2 rounded-full bg-white" />
              Asking…
            </span>
          ) : (
            "Ask"
          )}
        </button>

        {!recording ? (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || busy || !analysisId}
            aria-label="Record question with microphone"
            className="min-h-[44px] rounded-input border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-forest hover:text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-50"
          >
            🎤 Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="min-h-[44px] rounded-input bg-coral px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#cc5848] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            <span className="inline-flex items-center gap-2">
              <span className="see-stage-dot inline-block h-2 w-2 rounded-full bg-white" />
              Stop recording
            </span>
          </button>
        )}
      </div>

      {!analysisId && (
        <p className="text-sm text-muted">Analyze an image first to enable follow-up questions.</p>
      )}
      {micError && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-amber/10 p-2 text-sm text-amber">
          <span aria-hidden>ℹ</span>
          <span>{micError}</span>
        </p>
      )}
      {submitError && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 p-2 text-sm text-danger">
          <span aria-hidden>⚠</span>
          <span>{submitError}</span>
        </p>
      )}
    </section>
  );
}
