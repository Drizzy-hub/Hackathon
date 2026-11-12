"use client";

import { RankedObservation, StructuredObservations } from "../lib/types";

interface Props {
  observations: StructuredObservations | null;
  ranked: RankedObservation[] | null;
}

const STATUS_LABEL: Record<string, { text: string; className: string; icon: string }> = {
  legible:   { text: "Legible",   className: "bg-emerald-100 text-emerald-900",   icon: "✓" },
  clear:     { text: "Clear",     className: "bg-emerald-100 text-emerald-900",   icon: "✓" },
  partial:   { text: "Partial",   className: "bg-amber-soft text-amber",          icon: "~" },
  uncertain: { text: "Uncertain", className: "bg-amber-soft text-amber",          icon: "?" },
  illegible: { text: "Illegible", className: "bg-coral-soft text-danger",         icon: "✗" },
};

function StatusBadge({ status }: { status: string }) {
  const s =
    STATUS_LABEL[status] ?? { text: status, className: "bg-sage text-forest", icon: "•" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      <span aria-hidden>{s.icon}</span>
      <span>{s.text}</span>
    </span>
  );
}

export default function EvidencePanel({ observations, ranked }: Props) {
  if (!observations || !ranked) return null;

  const maxScore = Math.max(...ranked.map((r) => r.score), 1);

  return (
    <section
      aria-labelledby="evidence-heading"
      className="see-lift see-fade-in rounded-feature border border-line-strong bg-surface p-5 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-amber" aria-hidden />
          <h2 id="evidence-heading" className="text-base font-semibold text-ink">
            Evidence &amp; ranking
          </h2>
        </div>
        <span className="see-chip" title="Scene type">
          <span className="text-muted">Scene:</span>&nbsp;
          <span className="font-semibold">{observations.scene_type}</span>
        </span>
      </div>

      <details className="mt-4 rounded-card border border-line p-3" open>
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Ranked observations ({ranked.length})
        </summary>
        <ul className="mt-3 space-y-2">
          {ranked.map((r, i) => {
            const pct = Math.round((r.score / maxScore) * 100);
            return (
              <li
                key={`${r.entity}-${i}`}
                className="see-fade-in relative overflow-hidden rounded-card border border-line bg-ivory/60 p-3"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-sage/80 to-sage/10"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="font-medium text-ink">{r.entity}</span>
                    {r.value && (
                      <span className="text-muted">— {r.value}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={r.status} />
                    <span className="rounded-md border border-line-strong bg-surface px-2 py-0.5 text-xs font-mono text-ink">
                      {r.score.toFixed(2)}
                    </span>
                  </div>
                </div>
                <dl className="relative mt-2 grid grid-cols-2 gap-1 text-xs text-muted sm:grid-cols-4">
                  <ScoreRow name="I" value={r.components.I} full={r.importance} />
                  <ScoreRow name="C" value={r.components.C} full={r.clarity} />
                  <ScoreRow name="R" value={r.components.R} full={undefined} />
                  <ScoreRow name="P" value={r.components.P} full={r.prominence} />
                </dl>
              </li>
            );
          })}
        </ul>
      </details>

      {observations.uncertainties.length > 0 && (
        <details className="mt-3 rounded-card border border-amber/30 bg-amber/5 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-amber">
            <span aria-hidden>ℹ </span>Uncertainties ({observations.uncertainties.length})
          </summary>
          <ul className="mt-2 list-inside list-disc text-sm text-ink/80">
            {observations.uncertainties.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function ScoreRow({ name, value, full }: { name: string; value: number; full?: number }) {
  return (
    <div className="flex items-baseline gap-1">
      <dt className="font-mono font-bold text-forest">{name}</dt>
      <dd>
        <span className="font-mono text-ink">{value.toFixed(2)}</span>
        {typeof full === "number" && (
          <span className="ml-1 text-[10px] text-muted">({full.toFixed(2)})</span>
        )}
      </dd>
    </div>
  );
}
