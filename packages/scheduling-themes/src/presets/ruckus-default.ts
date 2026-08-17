import { solarized } from "../palettes/solarized";
import type { SchedulingTheme } from "../types";

/**
 * Default scheduling theme for ruckus-systems-web (Solarized light).
 * Matches semantic tokens from apps/web/src/styles/global.css :root.
 */
export const ruckusDefaultTheme: SchedulingTheme = {
  cssVars: {
    "--color-bg": solarized.base3,
    "--color-bg-alt": solarized.base2,
    "--color-text": solarized.base01,
    "--color-heading": solarized.base02,
    "--color-secondary": solarized.base00,
    "--color-border": solarized.base2,
    "--color-border-highlight": solarized.base00,

    "--font-body":
      "'Space Grotesk', Menlo, Monaco, Consolas, 'Andale Mono', sans-serif",
    "--font-mono":
      "'Share Tech Mono', Menlo, Monaco, Consolas, 'Andale Mono', monospace",

    "--brand-blue": solarized.blue,
    "--page-bg": solarized.base3,
    "--page-fg": solarized.base01,
    "--accent-sage": solarized.cyan,
    "--accent-sage-light": "#d2eeec",
    "--accent-sage-text": solarized.cyan,
    "--accent-terracotta": solarized.orange,
    "--accent-gold": solarized.yellow,
    "--accent-teal": solarized.cyan,
    "--surface-soft": solarized.base2,
    "--surface-soft-border": solarized.base2,

    "--ts-accent": solarized.blue,
    "--ts-accent-light": "#d1eaf8",
    "--ts-accent-text": "#1a6fa8",
    "--ts-accent-hover": "#a8d4f0",
    "--ts-accent-shadow": "rgba(38, 139, 210, 0.3)",
    "--ts-surface": solarized.base3,
    "--ts-border": solarized.base2,
    "--ts-fg": solarized.base01,
  },
};
