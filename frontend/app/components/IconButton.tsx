"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "solid" | "ghost" | "outline";
type Tone = "neutral" | "primary" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
  tone?: Tone;
  children: ReactNode;
}

const base =
  "inline-flex items-center justify-center h-11 w-11 rounded-input " +
  "transition-colors duration-quick ease-out-soft " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const combos = {
  "solid-neutral":
    "bg-surface border border-line-strong text-ink hover:border-forest hover:text-forest",
  "solid-primary":
    "bg-forest text-white hover:bg-forest-hover active:bg-[#12332c]",
  "solid-danger":
    "bg-danger text-white hover:bg-[#9d3d3d]",
  "ghost-neutral":
    "bg-transparent text-muted hover:text-ink hover:bg-sage/40",
  "ghost-primary":
    "bg-transparent text-forest hover:bg-sage/40",
  "ghost-danger":
    "bg-transparent text-danger hover:bg-danger/10",
  "outline-neutral":
    "bg-transparent border border-line-strong text-ink hover:border-forest hover:text-forest",
  "outline-primary":
    "bg-transparent border border-forest text-forest hover:bg-sage/40",
  "outline-danger":
    "bg-transparent border border-danger text-danger hover:bg-danger/10",
} as const;

const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  {
    label,
    variant = "ghost",
    tone = "neutral",
    className = "",
    children,
    type = "button",
    ...rest
  },
  ref,
) {
  const key = `${variant}-${tone}` as keyof typeof combos;
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={[base, combos[key], className].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
});

export default IconButton;
