# @ruckus/brand-styles

Shared Ruckus Solarized CSS for site-level branding (tokens, typography, layout shell, UI primitives).

## Usage

Full bundle (fonts, tokens, base, components, layout):

```css
@import "@ruckus/brand-styles";
```

Granular imports:

```css
@import "@ruckus/brand-styles/tokens.css";
@import "@ruckus/brand-styles/base.css";
```

With Tailwind (ruckus-systems-web) — load fonts before Tailwind, then core (tokens through layout):

```css
@import '@ruckus/brand-styles/fonts.css';
@import 'tailwindcss';
@import '@ruckus/brand-styles/core.css';
```

## Consumer integration

Vendor or submodule this repo into consumer monorepos (e.g. `brand-styles/` or `packages/brand-styles`) and add it to bun workspaces.
