---
title: CLI Studio Generate Command
status: proposed
scope:
  - packages/cli
  - packages/compiler
  - sandbox/storybook
  - website
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
  { "category": "colors", "path": "colors.red.500", "name": "red.500", "value": "#ef4444" }
]
```

The generated `styled-system/tokens` module only exports `token(path)` and `token.var(path)` — the underlying token map
is module-private and there is no way to enumerate tokens from it. So a live import can't drive the viewer. The
`studio generate` command runs inside the compiler and already holds the fully-resolved token dictionary via
`ctx.driver.compiler.spec().tokens`, so it writes a self-contained snapshot instead. Refresh model is identical to the
rest of codegen: re-run when the config changes.

The viewer renders each token's **value** (the swatch/sample), so the first cut omits the CSS variable string; it can be
added later (Phase 7) via `token.var(path)`.

## Architecture

No Rust changes. The command reads the already-exposed `Spec` and writes files. The whole feature is TS in
`@pandacss/cli`:

- `packages/cli/src/studio-codegen.ts` — pure core. `buildTokensSnapshot(spec)` → `StudioToken[]`, and
  `studioFiles(tokens)` → `Record<relativePath, contents>` (tokens.json + static templates). No fs, no CLI concerns.
- `packages/cli/src/commands/studio.ts` — the `studio` command group, the `generate` subcommand, and the exported
  `runStudioGenerate` runner (fs write + logging). Mirrors `commands/analyze.ts`.
- `packages/cli/src/schema.ts` — `studioGenerateFlagsSchema` (extends `commonFlagsSchema`, adds `outdir`).
- `packages/cli/src/cli-main.ts` — wire `studio: studioCommand` into `subCommands`.
- `packages/cli/src/index.ts` — re-export `runStudioGenerate` (tests import from `../src`).

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

`spec.tokens.categories` is `Record<name, { name; typeName; values: string[] }>` (names per category); `spec.tokens.values`
is `Record<path, resolvedValue>` keyed by full path (`colors.red.500`).

## Implementation Phases

The whole scope, in order. Phases 1–3 are the first shippable slice; 4–7 are the rest of the v1 Studio surface,
sequenced — not dropped. Each phase lands independently and is testable on its own (Vitest against a `createFixture()`
temp project, mirroring `packages/cli/__tests__/codegen.test.ts`).

### Phase 1 — Command skeleton + `tokens.json`

Working `panda studio generate` that writes only the snapshot.

- `buildTokensSnapshot(spec)` — flatten `spec().tokens` into `StudioToken[]`; skip names with no resolved value.
- `studioFiles(tokens)` — return `{ 'tokens.json': prettyJson }` (grows in Phase 2).
- `studioGenerateFlagsSchema` — `commonFlagsSchema.extend({ outdir })`.
- `studioCommand` + `runStudioGenerate` — resolve `outdir` (default `styled-system/studio`), `mkdirSync`/`writeFileSync`
  each file, log `studio: wrote N files`.
- Wire `studio` into `cli-main.ts`; re-export the runner from `src/index.ts`.
- Tests: unit tests on `buildTokensSnapshot`/`studioFiles`; command test asserting `tokens.json` carries real colors and
  that `--outdir` is honoured; `studio --help` smoke.

### Phase 2 — Viewer components + stories

Add the React surface to `studioFiles`.

- `TOKEN_GRID_TSX` — plain-React `TokenGrid({ category })`: imports `../tokens.json`, filters by category, renders a
  per-category preview (colors → swatch; spacing/sizes → bar; radii → rounded box; shadows → shadowed box; typography →
  text sample) plus name + value labels. Inline styles only.
- Story templates — `Colors`, `Spacing`, `Sizes`, `Radii`, `Shadows` (one named export each) and `Typography` (five
  exports: fontSizes/fontWeights/fonts/lineHeights/letterSpacings). CSF3 `Meta` default + `StoryObj` args.
- Tests: assert each file is emitted with the right `title`/`category`; extend the command test to assert the files land
  on disk.

### Phase 3 — Verify in `sandbox/storybook` + docs

Prove it end-to-end and document it.

- Generate into `sandbox/storybook` (Panda config + styled-system already present); add the `styled-system/studio` glob
  to the sandbox `.storybook/main` `stories`; run Storybook; confirm a "Design System" section renders real sandbox
  tokens. Keep the generated output gitignored.
- Changeset (`@pandacss/cli` minor).
- Rewrite `website/content/docs/theming/studio.mdx` around the command (setup, `--outdir`, refresh model, what's shown),
  replacing the v1 install/server instructions.

### Phase 4 — Semantic tokens + theme selector

The largest remaining piece; it was the bulk of v1's Astro complexity (`getActiveTheme`, `getThemeRelevantTokens`,
deep-merge, theme switching).

- **Prerequisite:** expose a semantic-token view on the compiler `spec()` — today `spec.tokens.values` is flat resolved
  values with no condition map. Needs the per-token condition set (`{ base, _dark, … }`) and the multi-theme definitions
  (`config.themes[name]`). Scope this against `crates/pandacss_project` + the `Spec` type in
  `packages/compiler-shared/src/types/output.ts`.
- `StudioToken` gains `conditions?: Record<string, string>`; `buildTokensSnapshot` emits semantic tokens with their
  condition values, and snapshots each named theme alongside base.
- New `SemanticTokens.stories.tsx` + a `ThemeSelector` control that swaps `data-theme`/class on the preview root and
  re-reads condition values.
- Tests: sandbox config with a semantic token + `_dark` condition; assert the snapshot carries both condition values;
  render both themes.

### Phase 5 — Contrast checker

Standalone accessibility tool (v1 `playground/contrast-checker`).

- Port v1 `lib/color-contrast-checker.ts` (WCAG contrast math) into an emitted `contrast.ts` util — pure, no deps.
- `ContrastChecker.stories.tsx` — pick two color tokens, show contrast ratio + AA/AAA pass badges.
- Tests: unit-test the ratio function against known pairs (`#000`/`#fff` → 21); story is visual.

### Phase 6 — Typography playground

Interactive editor (v1 `playground/typography`).

- `TypographyPlayground.stories.tsx` — controls for size/weight/family/line-height/letter-spacing sourced from the
  typography slice of `tokens.json`, live-previewing sample text. No snapshot change.
- Tests: visual; assert the story file emits and imports `tokens.json`.

### Phase 7 — codegen integration + CSS-variable metadata

Optional polish.

- Optionally refresh an existing `studio/` output during `panda codegen` (guarded by a config flag or by detecting the
  dir). Separate command by default; this only adds an opt-in hook.
- Add `variable: string` to `StudioToken` via `token.var(path)` or a shared cssVar formatter (**prerequisite:** locate
  the formatter; not exposed on `Spec` today) so viewers can show `var(--…)` alongside the value.
- Tests: snapshot a known token's `variable`; codegen integration test that a second run refreshes `tokens.json`.

## Verification

Generate into the existing `sandbox/storybook` package (Panda config + styled-system already present), run its
Storybook, and confirm each section renders real tokens from the sandbox config. This is the Phase 3 gate and the proof
attached to the PR.

## Unresolved Questions

- Default `--outdir`: `styled-system/studio` vs a top-level `studio/`. Leaning `styled-system/studio` for the
  co-located-codegen mental model; revisit if it clutters the styled-system output.
- Whether `panda codegen` should refresh an existing studio output in the same pass (Phase 7) or stay fully separate.
  Starting separate (explicit command only).
- Phase 4 needs a semantic/condition token view on `spec()` that does not exist yet — sizing that compiler change is the
  first Phase 4 task.

## Related

- [cli-design-md](./cli-design-md.md) — shared CLI flag set and command conventions.
- [codegen-design](./codegen-design.md) — the artifact codegen model this command mirrors.
