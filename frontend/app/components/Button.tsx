"use client";

import { forwardRef, ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "tertiary" | "danger";
type Size = "md" | "sm";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-input font-semibold " +
  "transition-[background-color,border-color,color,box-shadow] duration-quick ease-out-soft " +
  "disabled:cursor-not-allowed disabled:opacity-50 select-none";

const sizes: Record<Size, string> = {
  md: "h-[46px] px-5 text-[15px] min-w-[44px]",
  sm: "h-[38px] px-4 text-[14px] min-w-[44px]",
};

const variants: Record<Variant, string> = {
  primary:
    "bg-forest text-white hover:bg-forest-hover active:bg-[#12332c] " +
    "disabled:bg-forest/60 disabled:text-white/90",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-forest hover:text-forest " +
    "active:bg-sage/40",
  tertiary:
    "bg-transparent text-ink hover:text-forest hover:bg-sage/40 active:bg-sage/60",
  danger:
    "bg-danger text-white hover:bg-[#9d3d3d] active:bg-[#8a3636]",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    loading,
    leadingIcon,
    trailingIcon,
    fullWidth,
    className = "",
    children,
    disabled,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        base,
        sizes[size],
        variants[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        leadingIcon
      )}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  );
});

export default Button;
