import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg)",
        surface: "var(--surface)",
        raised: "var(--surface-raised)",
        line: "var(--border)",
        "line-strong": "var(--control-border)",
        ink: "var(--text)",
        muted: "var(--text-muted)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-active": "var(--primary-active)",
        "on-primary": "var(--on-primary)",
        money: "var(--money)",
        "money-text": "var(--money-text)",
        "money-bg": "var(--money-bg)",
        "money-border": "var(--money-border)",
        "on-money": "var(--on-money)",
        cream: "var(--cream)",
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
        "success-border": "var(--success-border)",
        warning: "var(--warning)",
        "warning-bg": "var(--warning-bg)",
        "warning-border": "var(--warning-border)",
        danger: "var(--danger)",
        "danger-bg": "var(--danger-bg)",
        "danger-border": "var(--danger-border)",
        "on-danger": "var(--on-danger)",
        "info-bg": "var(--info-bg)",
        "info-border": "var(--info-border)",
        selected: "var(--selected-bg)",
        input: "var(--input-bg)",
        overlay: "var(--overlay)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      backgroundImage: {
        brand: "var(--brand-gradient)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;

