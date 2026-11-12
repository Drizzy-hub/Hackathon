interface Props {
  size?: number;
  className?: string;
}

export default function BrandMark({ size = 28, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label="SeeLess"
      className={className}
    >
      <rect x="0" y="0" width="32" height="32" rx="8" fill="#183D35" />
      <path
        d="M9 20.5 C 12 14.5, 20 14.5, 23 20.5"
        stroke="#F8F7F2"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M9 20.5 C 12 26.5, 20 26.5, 23 20.5"
        stroke="#DCE8DF"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.9"
      />
      <circle cx="16" cy="20.5" r="2.4" fill="#F8F7F2" />
      <circle cx="16" cy="20.5" r="1" fill="#183D35" />
    </svg>
  );
}
