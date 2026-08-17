import type { SchedulingTheme } from "../types";

/**
 * Scheduling theme for Radiant Heart Ayurveda.
 * Maps site palette from apps/web/src/styles/global.css.
 */
export const radiantTheme: SchedulingTheme = {
  cssVars: {
    "--color-bg": "#ffffff",
    "--color-bg-alt": "#F9F5F0",
    "--color-text": "#4b5563",
    "--color-heading": "#759778",
    "--color-secondary": "#799999",
    "--color-border": "#e5e7eb",
    "--color-border-highlight": "#759778",

    "--font-body": "'Montserrat', sans-serif",
    "--font-mono": "'Playfair Display', serif",

    "--brand-blue": "#759778",
    "--page-bg": "#F9F5F0",
    "--page-fg": "#759778",
    "--accent-sage": "#799999",
    "--accent-sage-light": "#F9F5F0",
    "--accent-sage-text": "#759778",
    "--accent-terracotta": "#d2774d",
    "--accent-gold": "#E6B325",
    "--accent-teal": "#799999",
    "--surface-soft": "#F9F5F0",
    "--surface-soft-border": "#F5E8DB",

    "--ts-accent": "#759778",
    "--ts-accent-light": "#eef4ee",
    "--ts-accent-text": "#5a7a5c",
    "--ts-accent-hover": "#d6e4d7",
    "--ts-accent-shadow": "rgba(117, 151, 120, 0.3)",
    "--ts-surface": "#ffffff",
    "--ts-border": "#e5e7eb",
    "--ts-fg": "#374151",
  },
};
