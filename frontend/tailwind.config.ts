import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#183D35",
          hover: "#245548",
        },
        brand: {
          DEFAULT: "#183D35",
          hover: "#245548",
        },
        sage: "#DCE8DF",
        ivory: "#F8F7F2",
        cream: "#FFF4E8",
        surface: "#FFFFFF",
        ink: "#202925",
        muted: "#69736D",
        line: "#E3E6DF",
        "line-strong": "#D9E1DA",
        success: "#26734D",
        warning: "#A66A24",
        danger: "#B54747",
        info: "#426B88",
        coral: {
          DEFAULT: "#E66A5A",
          soft: "#F6B5AC",
        },
        amber: {
          DEFAULT: "#D99A3F",
          soft: "#F2D199",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "serif"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
        display: ["40px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h2: ["28px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        h3: ["20px", { lineHeight: "1.3" }],
        body: ["16px", { lineHeight: "1.6" }],
        small: ["14px", { lineHeight: "1.55" }],
        label: ["13px", { lineHeight: "1.4", letterSpacing: "0.01em" }],
      },
      spacing: {
        "0.5": "2px",
      },
      borderRadius: {
        input: "8px",
        card: "12px",
        feature: "16px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(32, 41, 37, 0.04)",
        card: "0 1px 2px 0 rgba(32, 41, 37, 0.03), 0 1px 1px 0 rgba(32, 41, 37, 0.02)",
        focus: "0 0 0 3px rgba(24, 61, 53, 0.15)",
      },
      transitionDuration: {
        "quick": "120ms",
        "base": "180ms",
      },
      transitionTimingFunction: {
        "out-soft": "cubic-bezier(0.2, 0.7, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
