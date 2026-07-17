---
'@pandacss/cli': minor
---

Add `panda studio` to visualize your design tokens.

- `panda studio` boots a live viewer — plain HTML/CSS/JS, no framework or bundler — that renders your tokens grouped by
  category, with light/dark theming. Set the port with `--port`.
- `panda studio generate` writes the token views into your project as source (shadcn-style) so you own them and render
  them where you document your design system — an app route, an MDX page, or Storybook. Views match your
  `config.jsxFramework` (React or Solid) and land in `styled-system/studio` by default (`--outdir` to change).

Both read a generated `tokens.json` snapshot. Re-run to refresh after a config change.
