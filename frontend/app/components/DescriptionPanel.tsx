"use client";

interface Props {
  description: string | null;
  isAnalyzing: boolean;
  statusMessage: string | null;
  error: string | null;
}

export default function DescriptionPanel({
  description,
  isAnalyzing,
  statusMessage,
  error,
}: Props) {
  return (
    <section
      aria-labelledby="description-heading"
      className="see-lift rounded-feature border border-line-strong bg-surface p-5 shadow-card"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-forest" aria-hidden />
          <h2 id="description-heading" className="text-base font-semibold text-ink">
            Description
          </h2>
        </div>
        <span className="text-xs text-muted">Verify for critical decisions</span>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isAnalyzing ? "Analyzing image." : statusMessage ?? ""}
      </div>

      {isAnalyzing && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span
              aria-hidden
              className="see-stage-dot inline-block h-2.5 w-2.5 rounded-full bg-coral"
            />
            <span>Analyzing image…</span>
          </div>
          <div className="see-shimmer h-3 w-full" />
          <div className="see-shimmer h-3 w-11/12" />
          <div className="see-shimmer h-3 w-4/5" />
          <div className="see-shimmer h-3 w-2/3" />
        </div>
      )}

      {error && !isAnalyzing && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger"
        >
          <span aria-hidden>⚠</span>
          <span>{error}</span>
        </p>
      )}

      {!isAnalyzing && !error && description && (
        <p className="see-fade-in whitespace-pre-wrap text-ink">{description}</p>
      )}

      {!isAnalyzing && !error && !description && (
        <p className="text-sm text-muted">
          <span aria-hidden>👁 </span>No description yet. Upload or capture an image to begin.
        </p>
      )}
    </section>
  );
}
