import type { SchedulingTheme } from "./types";

/** Merge a base theme with partial overrides (host-specific tweaks). */
export function mergeThemes(
  base: SchedulingTheme,
  override?: Partial<SchedulingTheme>,
): SchedulingTheme {
  if (!override?.cssVars) {
    return base;
  }

  return {
    cssVars: {
      ...base.cssVars,
      ...override.cssVars,
    },
  };
}

/** Serialize theme CSS variables for an inline `style` attribute. */
export function themeToInlineStyle(theme: SchedulingTheme): string {
  return Object.entries(theme.cssVars)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
}
