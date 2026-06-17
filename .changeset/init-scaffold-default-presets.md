---
'@pandacss/cli': patch
---

Scaffold and install the default presets in `panda init` so new projects are styled out of the box.

v2 resolves presets explicitly — a config without `presets` produces a bare system (no `bg`/`color` utilities, no
`fontSizes`/spacing scales, no `_hover`/`_active` conditions). The generated `panda.config.ts` now includes
`presets: ['@pandacss/preset-base', '@pandacss/preset-panda']`, and `panda init` installs both as devDependencies of the
project so the string specifiers resolve from the project root — including under pnpm's isolated `node_modules`.

- the package manager is detected from the `packageManager` field (corepack), then the lockfile, defaulting to npm.
- `--no-install` opts out: scaffolds a bare config (`presets: []`) and installs nothing.
- with no usable `package.json`, the config is scaffolded bare and a hint explains what to add — codegen still succeeds.
- re-running `init` on an existing config doesn't touch dependencies; `--force` re-scaffolds and installs.
