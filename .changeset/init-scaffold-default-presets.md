---
'@pandacss/cli': patch
'@pandacss/dev': patch
---

Scaffold the default presets in `panda init` so new projects are styled out of the box.

v2 resolves presets explicitly — a config without `presets` produces a bare system (no `bg`/`color` utilities, no
`fontSizes`/spacing scales, no `_hover`/`_active` conditions). The generated `panda.config.ts` now includes
`presets: ['@pandacss/preset-base', '@pandacss/preset-panda']`, and both presets are shipped as dependencies of
`@pandacss/dev` so they resolve without a separate install.
