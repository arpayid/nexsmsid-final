import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          muted: "hsl(var(--sidebar-muted) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
          accent: "hsl(var(--sidebar-accent) / <alpha-value>)",
        },
        "surface-muted": "hsl(var(--surface-muted) / <alpha-value>)",
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        brand: {
          emerald: "hsl(var(--brand-emerald) / <alpha-value>)",
          teal: "hsl(var(--brand-teal) / <alpha-value>)",
          indigo: "hsl(var(--brand-indigo) / <alpha-value>)",
          amber: "hsl(var(--brand-amber) / <alpha-value>)",
          coral: "hsl(var(--brand-coral) / <alpha-value>)",
          slate: "hsl(var(--brand-slate) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      boxShadow: {
        soft: "0 1px 2px hsl(222 47% 11% / 0.04), 0 4px 16px hsl(222 47% 11% / 0.05)",
        card: "0 0 0 1px hsl(var(--border) / 0.6), 0 1px 2px hsl(222 47% 11% / 0.04), 0 4px 12px hsl(222 47% 11% / 0.03)",
        elevated: "0 0 0 1px hsl(var(--border) / 0.5), 0 8px 24px hsl(222 47% 11% / 0.08), 0 2px 6px hsl(222 47% 11% / 0.04)",
        premium: "0 0 0 1px hsl(var(--border) / 0.5), 0 12px 40px hsl(222 47% 11% / 0.1), 0 4px 12px hsl(222 47% 11% / 0.05)",
        glow: "0 0 0 1px hsl(var(--primary) / 0.15), 0 8px 32px hsl(var(--primary) / 0.12)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
