# Panda Spec Studio

Bring your Panda CSS design system and instantly **see** it — colors, spacing, type, radii, shadows — rendered straight from the JSON Panda emits. No install, no server, no account. Drop a file or paste JSON; it renders.

![Colors rendered in Panda Spec Studio](docs/colors-light.png)

## Get your `tokens.json`

Run `panda codegen` in any Panda project, then grab the file it writes:

```
styled-system/specs/tokens.json
```

Drop that file (or your whole `styled-system/` folder) onto the app — or paste its contents, or hit **Load sample** to see it work with the Panda preset.

## Develop

This app lives in the Panda monorepo and uses the workspace `@pandacss/*` packages. From the repo root:

```bash
pnpm install
pnpm --filter @pandacss/spec-studio dev      # Nuxt dev server
pnpm --filter @pandacss/spec-studio build     # nuxt prepare + panda codegen + nuxt build
pnpm --filter @pandacss/spec-studio generate  # panda codegen + nuxt generate → static site
```

`generate` produces a fully static site in `.output/public`, deployable to Vercel / Netlify / any static host.

## What it does

- **Renders every category** with a view that fits it: colors & gradients → swatch grid, spacing/sizes/radii → a sorted scale, fonts → specimens, fontSizes/lineHeights/letterSpacings/fontWeights → a type ramp, shadows/borders → sample boxes, aspectRatios → boxes at that ratio, blurs → a blur ramp, durations/easings/animations → live animated chips, everything else → a clean name/value table.
- **Any Panda `tokens.json`**, not just the bundled sample — drop your own system and its categories render by type. (A dropped system's custom `@keyframes` aren't in the spec, so those animation chips render static; the standard `spin/ping/pulse/bounce` play.)
- **Search** filters the active category; **click any token** to copy its `name` (what you'd type in `css({ ... })`).
- **Light + dark** and discovered theme/variant switching, so semantic `var()` tokens paint their real colors.
- **Persists** your last-loaded system in IndexedDB, so a refresh keeps it.
- Bad JSON shows a clear inline error, never a blank screen.

<p>
  <img src="docs/spacing.png" width="49%" alt="Spacing scale" />
  <img src="docs/colors-dark.png" width="49%" alt="Colors in dark mode" />
</p>

## Stack

Nuxt 3 + Vue 3, [Panda CSS](https://panda-css.com) (workspace `@pandacss/*`), [Ark UI](https://ark-ui.com) for accessible primitives (tabs, file upload, clipboard, fields).

## Analyze usage

The rail's **Analyze usage** link is a first, no-backend tier: drop your source files (or repo folder) and it reports, per category, which tokens are **used / unused / hot**. It's a heuristic name-match scan — accurate for named tokens (`red.500`, counting both `'red.500'` and `token('colors.red.500')`), approximate for bare-numeric ones (`spacing.4`).

**Precise (next):** compiler-grade usage via `@pandacss/compiler-wasm`. Its `WasmExtractor` needs only a token dictionary (buildable from `tokens.json`), but the full per-token `createUsageReport` wants `FileInspectionResult[]` from `WasmCompiler.fromConfig(SerializedConfig)` — so the dropped repo's `panda.config.ts` still has to be evaluated/serialized in the browser. That config-bundling step is the remaining headline problem.
