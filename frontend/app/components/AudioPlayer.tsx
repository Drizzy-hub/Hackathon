"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  audioUrl: string | null;
  label: string;
  disabled?: boolean;
  isSynthesizing?: boolean;
}

export default function AudioPlayer({ audioUrl, label, disabled, isSynthesizing }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<string>("No audio loaded.");

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    setIsPlaying(false);
    if (audioUrl) {
      el.src = audioUrl;
      el.load();
      setStatus("Audio ready. Press play to listen.");
    } else {
      setStatus(isSynthesizing ? "Synthesizing audio…" : "No audio loaded.");
    }
  }, [audioUrl, isSynthesizing]);

  const play = async () => {
    try {
      await audioRef.current?.play();
      setIsPlaying(true);
      setStatus("Playing.");
    } catch {
      setStatus("Unable to play audio.");
    }
  };
  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
    setStatus("Paused.");
  };
  const stop = () => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setIsPlaying(false);
    setStatus("Stopped.");
  };
  const replay = () => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    void play();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "k" || e.key === "K") {
      e.preventDefault();
      if (isPlaying) pause();
      else void play();
    }
  };

  const showWave = isPlaying || isSynthesizing;

  return (
    <section
      aria-label={label}
      className="see-lift rounded-feature border border-line-strong bg-surface p-5 shadow-card"
      onKeyDown={onKey}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-ink">Audio</h3>
          <div
            className={`see-wave ${showWave ? "" : "is-paused"}`}
            aria-hidden
            style={{ color: isSynthesizing ? "#D99A3F" : "#183D35" }}
          >
            <span /><span /><span /><span /><span />
          </div>
        </div>
        <span aria-live="polite" className="text-xs text-muted">
          {isSynthesizing ? "Synthesizing…" : status}
        </span>
      </div>

      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          setStatus("Finished.");
        }}
        preload="auto"
        aria-label={label}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Btn onClick={play} disabled={disabled || !audioUrl || isPlaying} label="Play" tone="primary">
          ▶ Play
        </Btn>
        <Btn onClick={pause} disabled={disabled || !isPlaying} label="Pause">
          ⏸ Pause
        </Btn>
        <Btn onClick={stop} disabled={disabled || !audioUrl} label="Stop">
          ⏹ Stop
        </Btn>
        <Btn onClick={replay} disabled={disabled || !audioUrl} label="Replay from start">
          ↺ Replay
        </Btn>
      </div>
    </section>
  );
}

function Btn({
  onClick,
  disabled,
  label,
  tone,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  tone?: "primary" | "neutral";
  children: React.ReactNode;
}) {
  const classes =
    tone === "primary"
      ? "bg-forest text-white border border-forest hover:bg-forest-hover shadow-sm"
      : "bg-surface text-ink border border-line-strong hover:border-forest hover:text-forest shadow-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`min-h-[44px] rounded-input px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest disabled:opacity-40 ${classes}`}
    >
      {children}
    </button>
  );
}
