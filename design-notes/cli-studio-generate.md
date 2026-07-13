---
title: CLI Studio Command
status: proposed
scope:
  - packages/cli
  - packages/compiler
  - sandbox/storybook
  - website
---

# CLI Studio Command

## Summary

`panda studio` replaces the removed v1 `@pandacss/studio` Astro app with two lighter tracks that share one token
snapshot:

- **`panda studio`** — boots a lightweight **live viewer** built from vanilla HTML/CSS/JS. This is the regression-safe
  replacement for the old "run a server, look at my tokens" flow, minus Astro, a framework runtime, and the deploy step.
- **`panda studio generate`** — emits the token **view components** as source into the user's project, shadcn-style, so
  they can render them however they document their design system (their app, Storybook, MDX…). Views respect
  `config.jsxFramework` — React and Solid.

Both read a generated `tokens.json` snapshot. Users own whatever `generate` writes and re-run to refresh.

## Problem

v1 Panda Studio (`packages/studio`, `packages/astro-plugin-studio`) was a full Astro application. To visualize their
tokens a user had to install `@pandacss/studio`, boot a local Astro server, and self-host it to share with a team. The
valuable part was always the token-viewer surface; the Astro shell, the framework runtime, and the deploy step were
overhead. Teams asked two different things:

- "I just want to boot a viewer and look at my tokens" — same as v1, but the Astro weight was never the point.
- "I document my design system my own way (Storybook, MDX, an internal app) — give me the views, not another app."

The v1 pipeline (and Studio with it) was removed in the Rust migration. This note defines the replacement: keep a live
viewer, but vanilla and minimal; and hand users the view code so they render it where they want.

## Command Shape

`studio` is a command group. Bare `panda studio` boots the live viewer; `generate` writes view source.

```sh
panda studio                          # boot the live vanilla viewer
panda studio --port 4000
panda studio generate                 # emit view components + tokens.json
panda studio generate --outdir .storybook/studio
panda studio generate -c panda.config.ts
```

- `panda studio` flags: `--port`, `--host`, plus shared `--config`/`-c`, `--cwd`.
- `panda studio generate` flags: `--outdir <dir>` (default `styled-system/studio` — codegen's home; re-runnable,
  discoverable), plus shared `--config`/`-c`, `--cwd`. Framework is read from `config.jsxFramework`.

Shared flags follow the standard CLI set in [`cli-design-md`](./cli-design-md.md).

## The three layers

The design has one framework-agnostic layer, one framework layer, and the user's renderer of choice on top:

1. **Live viewer (agnostic)** — plain DOM. Works regardless of `jsxFramework` because it imports no framework runtime.
2. **Generated views (React / Solid)** — real components, matched to `config.jsxFramework`.
3. **The user's renderer** — their app, an MDX page, or Storybook. Storybook is *not* an agnostic layer: it is
   framework-bound (`@storybook/react`, the Solid renderer, …), so a story simply wraps whichever generated view matches
   the project. We document the Storybook recipe; we do not emit stories.

## What `panda studio` serves — the live viewer

A self-contained static bundle, served over a minimal local server:

```
index.html      # mounts the grid, links studio.css, loads studio.js
studio.css       # layout + swatch/sample styles
studio.js        # fetch('tokens.json'), build the grid with vanilla DOM APIs
tokens.json      # the resolved token snapshot (see below)
```

`studio.js` groups tokens by category and renders a per-category preview (colors → swatch, spacing/sizes → bar, radii →
rounded box, shadows → shadowed box, typography → text sample) with name + value labels. No framework, no bundler. The
server is `node:http` serving the generated dir on `--port` — enough to satisfy the `fetch('tokens.json')` the page
needs, and nothing more.

## What `panda studio generate` emits — the views

```
<outdir>/
  tokens.json              # the resolved token snapshot
  components/
    token-grid.tsx         # shared: groups tokens by category, renders the swatch/sample grid
  Colors.tsx
  Typography.tsx           # fontSizes, fontWeights, fonts, lineHeights, letterSpacings
  Spacing.tsx
  Sizes.tsx
  Radii.tsx
  Shadows.tsx
```

Each view is a plain component with inline styles that reads `tokens.json` and renders one category. It does **not**
import the styled-system runtime, so it renders anywhere regardless of how the host app consumes Panda. The component
source is emitted for the project's `config.jsxFramework` — React (`.tsx` with React) or Solid (`.tsx` with `solid-js`).

Rendering is the user's choice. The docs show how to drop a view into a `*.stories.tsx` for Storybook, an MDX page, or a
route — but `generate` writes the views, not renderer-specific scaffolding.

## Data Source — snapshot, not live import

Both tracks read a generated `tokens.json`, not the user's `styled-system`:

```jsonc
// tokens.json
[
  { "category": "colors", "path": "colors.red.500", "name": "red.500", "value": "#ef4444" }
]
```

The generated `styled-system/tokens` module only exports `token(path)` and `token.var(path)` — the underlying token map
is module-private and there is no way to enumerate tokens from it. So a live import can't drive the viewer. The command
runs inside the compiler and already holds the fully-resolved token dictionary via
`ctx.driver.compiler.spec().tokens`, so it writes a self-contained snapshot instead. Refresh model is identical to the
rest of codegen: re-run when the config changes.

The viewer renders each token's **value** (the swatch/sample), so the first cut omits the CSS variable string; it can be
added later via `token.var(path)`.

## Architecture

No Rust changes. The command reads the already-exposed `Spec` and writes files. The whole feature is TS in
`@pandacss/cli`:

- `packages/cli/src/studio-codegen.ts` — pure core, no fs or CLI concerns. `buildTokensSnapshot(spec)` →
  `StudioToken[]`; `viewerFiles(tokens)` → the vanilla `index.html`/`studio.css`/`studio.js`/`tokens.json` set;
  `viewFiles(tokens, framework)` → the React/Solid view components + `tokens.json`.
- `packages/cli/src/studio-server.ts` — `serveStudio(dir, { port, host })`: a `node:http` static-file server over the
  viewer dir. No new dependency.
- `packages/cli/src/commands/studio.ts` — the `studio` command group. The bare command generates the viewer bundle
  (temp dir) and calls `serveStudio`; the `generate` subcommand writes view files to `--outdir`. Both exported as
  runners (`runStudioServe`, `runStudioGenerate`). Mirrors `commands/analyze.ts`.
- `packages/cli/src/schema.ts` — `studioServeFlagsSchema` (adds `port`, `host`) and `studioGenerateFlagsSchema` (adds
  `outdir`), both extending `commonFlagsSchema`.
- `packages/cli/src/cli-main.ts` — wire `studio: studioCommand` into `subCommands`.
- `packages/cli/src/index.ts` — re-export the runners (tests import from `../src`).

Data source shapes (from `@pandacss/compiler-shared`):

```ts
interface StudioToken { category: string; path: string; name: string; value: string }

function buildTokensSnapshot(spec: Spec): StudioToken[] {
  const out: StudioToken[] = []
  for (const [category, meta] of Object.entries(spec.tokens.categories)) {
    for (const name of meta.values) {
      const path = `${category}.${name}`
      const value = spec.tokens.values[path]
      if (value == null) continue
      out.push({ category, path, name, value })
    }
  }
  return out
}
```

`spec.tokens.categories` is `Record<name, { name; typeName; values: string[] }>` (names per category);
`spec.tokens.values` is `Record<path, resolvedValue>` keyed by full path (`colors.red.500`).

## Implementation Phases

Phases 1–4 are the shippable slice; 5–7 are the rest of the v1 Studio surface, sequenced — not dropped. Each phase lands
independently and is testable on its own (Vitest against a `createFixture()` temp project, mirroring
`packages/cli/__tests__/codegen.test.ts`).

### Phase 1 — Snapshot core + `generate` (React)

Working `panda studio generate` that writes React views + the snapshot.

- `buildTokensSnapshot(spec)` — flatten `spec().tokens` into `StudioToken[]`; skip names with no resolved value.
- `viewFiles(tokens, 'react')` — `token-grid.tsx` (plain React `TokenGrid({ category })` reading `../tokens.json`,
  per-category preview, inline styles) plus one view per category.
- `studioGenerateFlagsSchema`, `studioCommand` + `generate` subcommand + `runStudioGenerate` — resolve `outdir` (default
  `styled-system/studio`), read `config.jsxFramework`, write each file, log `studio: wrote N files`.
- Wire `studio` into `cli-main.ts`; re-export the runner from `src/index.ts`.
- Tests: unit tests on `buildTokensSnapshot`/`viewFiles`; command test asserting `tokens.json` carries real colors,
  views land on disk, and `--outdir` is honoured; `studio --help` smoke.

### Phase 2 — Solid views

Branch the view templates on framework.

- `viewFiles(tokens, 'solid')` — the same components authored for `solid-js`.
- Command reads `config.jsxFramework === 'solid'` and emits the Solid set.
- Tests: fixture with `jsxFramework: 'solid'`; assert Solid-flavoured source is emitted.

### Phase 3 — Live vanilla viewer + server

The regression-safe `panda studio` flow.

- `viewerFiles(tokens)` — `index.html`, `studio.css`, `studio.js` (vanilla DOM, `fetch('tokens.json')`), `tokens.json`.
- `serveStudio(dir, { port, host })` — `node:http` static server; `runStudioServe` builds the bundle to a temp dir and
  serves it.
- `studioServeFlagsSchema` (`port`, `host`); bare `panda studio` dispatches to `runStudioServe`.
- Tests: unit-test `viewerFiles` shape; server test that a request for `tokens.json` returns the snapshot.

### Phase 4 — Verify in `sandbox/storybook` + docs

Prove it end-to-end and document it.

- Generate into `sandbox/storybook` (Panda config + styled-system already present); document dropping a generated view
  into a `*.stories.tsx`; run Storybook; confirm a "Design System" section renders real sandbox tokens. Boot
  `panda studio` against the same config and confirm the vanilla viewer renders. Keep generated output gitignored.
- Changeset (`@pandacss/cli` minor).
- Rewrite `website/content/docs/theming/studio.mdx` around the two tracks (live viewer, `generate` + `--outdir`, refresh
  model, framework support, the Storybook/MDX rendering recipes), replacing the v1 install/server instructions.

### Phase 5 — Semantic tokens + theme selector

The largest remaining piece; it was the bulk of v1's Astro complexity (`getActiveTheme`, `getThemeRelevantTokens`,
deep-merge, theme switching).

- **Prerequisite:** expose a semantic-token view on the compiler `spec()` — today `spec.tokens.values` is flat resolved
  values with no condition map. Needs the per-token condition set (`{ base, _dark, … }`) and the multi-theme definitions
  (`config.themes[name]`). Scope this against `crates/pandacss_project` + the `Spec` type in
  `packages/compiler-shared/src/types/output.ts`.
- `StudioToken` gains `conditions?: Record<string, string>`; `buildTokensSnapshot` emits semantic tokens with their
  condition values, and snapshots each named theme alongside base.
- A theme selector in both the live viewer and the generated views: swap `data-theme`/class on the preview root and
  re-read condition values.
- Tests: sandbox config with a semantic token + `_dark` condition; assert the snapshot carries both condition values;
  render both themes.

### Phase 6 — Contrast checker

Standalone accessibility tool (v1 `playground/contrast-checker`).

- Port v1 `lib/color-contrast-checker.ts` (WCAG contrast math) into an emitted `contrast.ts` util — pure, no deps.
- A contrast view: pick two color tokens, show contrast ratio + AA/AAA pass badges.
- Tests: unit-test the ratio function against known pairs (`#000`/`#fff` → 21); the view is visual.

### Phase 7 — Typography playground + CSS-variable metadata

Interactive editor (v1 `playground/typography`) plus optional polish.

- A typography playground view: controls for size/weight/family/line-height/letter-spacing sourced from the typography
  slice of `tokens.json`, live-previewing sample text.
- Add `variable: string` to `StudioToken` via `token.var(path)` or a shared cssVar formatter (**prerequisite:** locate
  the formatter; not exposed on `Spec` today) so views can show `var(--…)` alongside the value.
- Tests: the playground view is visual; snapshot a known token's `variable`.

## Verification

Generate into the existing `sandbox/storybook` package (Panda config + styled-system already present), render a
generated view through its Storybook, and boot `panda studio` against the same config — confirm both surfaces show real
tokens from the sandbox config. This is the Phase 4 gate and the proof attached to the PR.

## Unresolved Questions

- Default `--outdir`: `styled-system/studio` vs a top-level `studio/`. Leaning `styled-system/studio` for the
  co-located-codegen mental model; revisit if it clutters the styled-system output.
- Frameworks beyond React and Solid (Vue, Svelte, Preact) — generated views only. Deferred until asked for; the vanilla
  live viewer already covers those users.
- Phase 5 needs a semantic/condition token view on `spec()` that does not exist yet — sizing that compiler change is the
  first Phase 5 task.

## Related

- [cli-design-md](./cli-design-md.md) — shared CLI flag set and command conventions.
- [codegen-design](./codegen-design.md) — the artifact codegen model `generate` mirrors.
