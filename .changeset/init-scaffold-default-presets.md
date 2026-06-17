---
'@pandacss/cli': patch
---

Scaffold and install the default presets in `panda init` so new projects are styled out of the box.

v2 resolves presets explicitly — a config without `presets` produces a bare system (no `bg`/`color` utilities, no
`fontSizes`/spacing scales, no `_hover`/`_active` conditions). The generated `panda.config.ts` now includes
`presets: ['@pandacss/preset-base', '@pandacss/preset-panda']`, and `panda init` installs both as devDependencies of the
project (detecting npm/pnpm/yarn/bun) so the string specifiers resolve from the project root — including under pnpm's
isolated `node_modules`. Pass `--no-install` to opt out: it scaffolds a bare config (`presets: []`) and installs
nothing.
