import type { Config } from "tailwindcss";

const config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        muted: "var(--muted)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        secondary: "var(--secondary)",
        destructive: "var(--destructive)",
      },
      borderRadius: {
        sm: "calc(var(--radius) - 2px)",
        md: "var(--radius)",
        lg: "calc(var(--radius) + 2px)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        lifted: "var(--shadow-lifted)",
      },
      fontSize: {
        "display-lg": ["4rem", { lineHeight: "1.05", fontWeight: "650" }],
        "display-md": ["3rem", { lineHeight: "1.08", fontWeight: "650" }],
      },
      spacing: {
        section: "clamp(3rem, 7vw, 6rem)",
      },
    },
  },
} satisfies Config;

export default config;
