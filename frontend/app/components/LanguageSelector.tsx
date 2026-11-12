"use client";

import { useCallback, useRef } from "react";
import { LANGUAGES, Language } from "../lib/types";

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
  disabled?: boolean;
}

export default function LanguageSelector({ value, onChange, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) {
        return;
      }
      e.preventDefault();
      let next = index;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + LANGUAGES.length) % LANGUAGES.length;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % LANGUAGES.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = LANGUAGES.length - 1;
      onChange(LANGUAGES[next].code);
      const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[next]?.focus();
    },
    [onChange],
  );

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Description language"
      className="inline-flex flex-wrap gap-1 rounded-full border border-line-strong bg-surface/80 p-1 shadow-subtle backdrop-blur"
    >
      {LANGUAGES.map((lang, i) => {
        const selected = lang.code === value;
        return (
          <button
            key={lang.code}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(lang.code)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            className={`min-w-[88px] rounded-full px-4 py-2 text-sm font-semibold transition-all duration-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest ${
              selected
                ? "bg-forest text-white shadow-[0_6px_14px_-6px_rgba(24,61,53,0.5)]"
                : "text-muted hover:bg-sage/50 hover:text-ink"
            } disabled:opacity-50`}
          >
            <span aria-hidden>{lang.native}</span>
            <span className="sr-only">{lang.label}</span>
          </button>
        );
      })}
    </div>
  );
}
