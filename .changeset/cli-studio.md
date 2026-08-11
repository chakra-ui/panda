---
'@pandacss/cli': minor
---

Add `panda studio` to visualize your design tokens.

- `panda studio` boots a live viewer — plain HTML/CSS/JS, no framework or bundler — that renders your tokens grouped by
  category, with light/dark theming. Set the port with `--port`.
- `panda studio generate` writes the token views into your project as source (shadcn-style) so you own them and render
  them where you document your design system — an app route, an MDX page, or Storybook. Views match your
  `config.jsxFramework` (React or Solid) and land in `styled-system/studio` by default (`--outdir` to change).
- Semantic tokens render a swatch per condition (`base`, `_dark`, …) and per named theme, resolved to real values, so
  you can see what a token becomes in every mode.
- A contrast checker lets you pick two color tokens and read the WCAG contrast ratio with AA/AAA pass badges.
- A typography playground combines font-size, weight, family, line-height, and letter-spacing tokens on your own sample
  text to preview a text style before you build it.

Both read a generated `tokens.json` snapshot. Re-run to refresh after a config change.
