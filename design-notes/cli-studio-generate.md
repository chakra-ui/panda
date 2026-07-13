---
title: CLI Studio Generate Command
status: proposed
scope:
  - packages/cli
  - packages/compiler
  - sandbox/storybook
---

# CLI Studio Generate Command

## Summary

`panda studio generate` emits design-system viewer source directly into the user's project — Storybook stories plus the
React components that render them — instead of spinning up a standalone app. It replaces the v1 `@pandacss/studio` Astro
server. Users own the generated code, drop it into their existing Storybook (or any React surface), and re-run the
command to refresh. No new server, no Astro, no separate deploy.

## Problem

v1 Panda Studio (`packages/studio`, `packages/astro-plugin-studio`) was a full Astro application. To visualize their
tokens a user had to install `@pandacss/studio`, run `panda studio` to boot a local Astro server, and self-host it to
share with a team. The valuable part was always the token-viewer React components (`colors.tsx`, `radii.tsx`,
`spacing.tsx`, typography views…); the Astro shell, the dev server, and the deploy step were pure overhead. Teams
already run Storybook and asked "why can't I just embed this there?" — the answer required manually re-mapping tokens by
hand.

The v1 pipeline (and Studio with it) was removed in the Rust migration. This note defines the replacement: give users
the code, shadcn-style, via a codegen command.

## Command Shape

```sh
panda studio generate
panda studio generate --outdir .storybook/studio
panda studio generate -c panda.config.ts
```

- `--outdir <dir>` — where to write. Default `styled-system/studio` (codegen's home; re-runnable, discoverable). Point
  the Storybook `stories` glob at it, or pass `--outdir` to target the Storybook directory directly.
- Shared flags: `--config`/`-c`, `--cwd` (per the standard CLI flag set in `cli-design-md.md`).

`studio` is a command group; `generate` is its only subcommand for now. Bare `panda studio` prints usage — there is no
longer a server to start.

## What It Emits

```
<outdir>/
  tokens.json              # snapshot of the resolved token dictionary
  components/
    token-grid.tsx         # shared: groups tokens by category, renders swatch/sample grid
  Colors.stories.tsx
  Typography.stories.tsx   # fontSizes, fontWeights, fonts, lineHeights, letterSpacings
  Spacing.stories.tsx
  Sizes.stories.tsx
  Radii.stories.tsx
  Shadows.stories.tsx
```

Each `*.stories.tsx` is plain CSF3 — a `Meta` default export (`title: 'Design System/Colors'`) plus one
`UpperCamelCase` named export that renders `<TokenGrid category="colors" />` against `tokens.json`. This is the portable
Storybook standard; no Storybook addon is required.

Emitted components are plain React with inline styles. They do **not** import the styled-system runtime, so the stories
render in any Storybook regardless of how the host app consumes Panda.

## Data Source — snapshot, not live import

The stories read a generated `tokens.json`, not the user's `styled-system`:

```jsonc
// tokens.json
[
  { "category": "colors", "path": "colors.red.500", "name": "red.500", "value": "#ef4444", "variable": "var(--colors-red-500)" }
]
```

The generated `styled-system/tokens` module only exports `token(path)` and `token.var(path)` — the underlying token map
is module-private and there is no way to enumerate tokens from it. So a live import can't drive the viewer. The
`studio generate` command runs inside the compiler and already holds the fully-resolved token dictionary, so it writes a
self-contained snapshot instead. Refresh model is identical to the rest of codegen: re-run when the config changes.

## In Scope vs Deferred

**In scope:** the flat token categories above (colors, typography scales, spacing, sizes, radii, shadows) — the ~80% of
Studio that only needs a token's value and CSS variable.

**Deferred** — the parts that made v1 heavy and are not needed for a first cut:

- Semantic-token / theme-merge views and the theme selector (v1 `getActiveTheme`/`getThemeRelevantTokens`).
- Contrast checker and typography playground (v1 `playground/*`).

These were the complexity sink in v1. Add them when users ask, as additional stories — the command shape does not need
to change.

## Verification

Generate into the existing `sandbox/storybook` package (Panda config + styled-system already present), run its
Storybook, and confirm each section renders real tokens from the sandbox config.

## Unresolved Questions

- Default `--outdir`: `styled-system/studio` vs a top-level `studio/`. Leaning `styled-system/studio` for the
  co-located-codegen mental model; revisit if it clutters the styled-system output.
- Whether `panda codegen` should optionally refresh an existing studio output in the same pass, or keep `studio
  generate` fully separate. Starting separate (explicit command only).

## Related

- [cli-design-md](./cli-design-md.md) — shared CLI flag set and command conventions.
- [codegen-design](./codegen-design.md) — the artifact codegen model this command mirrors.
