/**
 * CSS custom properties consumed by scheduling UI components
 * (BookingModal, ReschedulePage, CancelPage, time-slot-selection).
 */
export type SchedulingThemeCssVars = {
  "--color-bg"?: string;
  "--color-bg-alt"?: string;
  "--color-text"?: string;
  "--color-heading"?: string;
  "--color-secondary"?: string;
  "--color-border"?: string;
  "--color-border-highlight"?: string;
  "--font-body"?: string;
  "--font-mono"?: string;
  "--brand-blue"?: string;
  "--page-bg"?: string;
  "--page-fg"?: string;
  "--accent-sage"?: string;
  "--accent-sage-light"?: string;
  "--accent-sage-text"?: string;
  "--accent-terracotta"?: string;
  "--accent-gold"?: string;
  "--accent-teal"?: string;
  "--surface-soft"?: string;
  "--surface-soft-border"?: string;
  "--ts-accent"?: string;
  "--ts-accent-light"?: string;
  "--ts-accent-text"?: string;
  "--ts-accent-hover"?: string;
  "--ts-accent-shadow"?: string;
  "--ts-surface"?: string;
  "--ts-border"?: string;
  "--ts-fg"?: string;
};

export type SchedulingTheme = {
  cssVars: SchedulingThemeCssVars & Record<string, string>;
};
