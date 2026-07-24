# Panda CSS v2 — beta guide and migration

> v2 is in beta (`2.0.0-beta`). You write the same Panda you already know — `css()`, recipes, patterns, tokens,
> conditions, JSX props. What changed is the compiler. This guide is for v1 users trying the beta, and for anyone
> starting fresh on v2.
>
> New to Panda? Go straight to [Get started (new project)](#get-started-new-project).

---

## What v2 is

v2 keeps the framework and rewrites the compiler's hot path in Rust, on the [Oxc](https://oxc.rs) toolchain.

v1 ran extraction and evaluation through `ts-morph` and `ts-evaluator` in Node. v2 replaces that with a native engine,
shipped two ways:

- **`@pandacss/compiler`** — a native NAPI binding. The CLI and bundler plugins use this.
- **`@pandacss/compiler-wasm`** — a `wasm-bindgen` build of the same engine for the browser. The playground runs on it.

Both wrap the same Rust crates, so Node and browser builds produce the same CSS.

What you get:

- Faster extraction. One parse per file, no TypeScript program in the hot path.
- A smaller install. The `ts-morph` / `ts-evaluator` dependency tree is gone.
- The same CSS. Output stays in parity with v1 (see [What changed](#what-changed-in-v2)).

The authoring API is stable. The internal package layout and a few CLI surfaces are still unfinished. See
[Still being finalized](#still-being-finalized).

---

## Release channels

v1 and v2 ship side by side on npm.

| Channel  | Versions           | Install              |
| -------- | ------------------ | -------------------- |
| `latest` | v1 (`1.x`, stable) | `@pandacss/dev`      |
| `beta`   | v2 (`2.0.0-beta`)  | `@pandacss/dev@beta` |

Install without a tag and you get stable v1. Existing projects don't change. You get v2 only when you ask for `@beta`.

All `@pandacss/*` packages move together on one version, so every published package shares the same `2.0.0-beta`. Don't
mix a v1 package with a v2 one.

---

## Try the beta

### 1. Requirements

- **ESM only.** There is no CommonJS build. Your project has to `import` Panda — set `"type": "module"`, use `.mjs`, or
  run it through a bundler that handles ESM. `require('@pandacss/dev')` won't work.
- **Node 22 or newer.** Published packages declare `"engines": { "node": ">=22" }`.

### 2. Install

Most projects only need `@pandacss/dev`:

```bash
# pnpm
pnpm add -D @pandacss/dev@beta

# npm
npm i -D @pandacss/dev@beta

# yarn
yarn add -D @pandacss/dev@beta

# bun
bun add -d @pandacss/dev@beta
```

Add integrations on the same `@beta` tag when you need them:

```bash
pnpm add -D @pandacss/postcss@beta   # standalone PostCSS plugin
pnpm add -D @pandacss/vite@beta      # Vite plugin
pnpm add -D @pandacss/webpack@beta   # webpack plugin (Next.js compatible)
pnpm add -D @pandacss/rollup@beta    # Rollup plugin
```

You can wire up PostCSS two ways:

- `@pandacss/postcss` — the standalone plugin (key: `'@pandacss/postcss'`).
- `@pandacss/dev/postcss` — the same plugin re-exported, so you don't need a second install if you already have
  `@pandacss/dev`. This is what `panda init --postcss` writes.

Want reproducible installs? Pin an exact version (`@pandacss/dev@2.0.0-beta.0`). `@beta` always resolves to the newest
pre-release.

### 3. Build

On an existing v1 project, your `panda.config.ts` carries over. Regenerate:

```bash
panda build    # codegen + cssgen in one pass
panda dev      # rebuild on change
```

The `panda` and `pandacss` binaries are the same as v1. Starting fresh? See
[Get started (new project)](#get-started-new-project).

---

## Get started (new project)

Already on v1? Jump to [migration](#breaking-changes--migration).

### 1. Install

```bash
pnpm add -D @pandacss/dev@beta
```

Make sure the project resolves ESM — add `"type": "module"` to `package.json` if it isn't there.

### 2. Initialize

`panda init` writes a `panda.config.ts` and runs the first codegen into `styled-system/`. Useful flags:

```bash
panda init --postcss              # also write postcss.config.cjs
panda init --gitignore            # add styled-system to .gitignore (on by default)
panda init --jsxFramework react   # JSX helpers (react | preact | vue | solid | qwik)
panda init --outdir src/styled-system
panda init -i                     # interactive wizard (TTY only; not a log mode)
```

The wizard asks for PostCSS, `outExtension` (`js` / `mjs` / `ts`), JSX framework (or none), `jsxStyleProps` (`all` /
`minimal` / `none` when a framework is chosen), `strictTokens`, and `.gitignore`. Template-literal `syntax` stays a
flag/config option only.

### 3. Tell Panda what to scan

Point `include` at the files where you write styles:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'], // default utilities, tokens & conditions
  preflight: true, // CSS reset
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  theme: {
    extend: {},
  },
  outdir: 'styled-system',
})
```

> v2 doesn't auto-inject presets — without them you get a bare system (no `bg`/`color` utilities, no `fontSizes`/spacing
> scales, no `_hover`/`_active` conditions). `panda init` scaffolds this line and installs both presets for you. Pass
> `--skip-presets` to scaffold a bare config instead.

### 4. Add Panda to your CSS

Declare the cascade layers in your root stylesheet (e.g. `src/index.css`):

```css
@layer reset, base, tokens, recipes, utilities;
```

Run it through the PostCSS plugin (`panda init --postcss` writes this for you):

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {},
  },
}
```

For older browsers, set `polyfill: true` (or `--polyfill`). v2 polyfills layers in the emitter — you don't need
`@csstools/postcss-cascade-layers` for Panda CSS.

### 5. Write styles

```tsx
import { css } from '../styled-system/css'

export const Button = () => (
  <button className={css({ bg: 'red.400', color: 'white', px: '4', py: '2', rounded: 'md' })}>Hello 🐼</button>
)
```

### 6. Build

```bash
panda build    # codegen + cssgen
panda dev      # rebuild on change
```

The CLI writes types and helpers under `styled-system/`. Re-run `panda build` (or keep `panda dev` running) whenever you
change tokens, recipes, or patterns. For the full tutorial — recipes, patterns, conditions, theming — see the
[docs](https://panda-css.com).

---

## What changed in v2

The engine aims for the same CSS as v1. These are the differences you'll notice, and they're on purpose.

### CSS output

- **Native token CSS.** Token variables come from the Rust stylesheet compiler. The default `cssVarRoot` matches v1:
  `:where(:root, :host)`.
- **Merged adjacent selectors.** Consecutive rules with an identical declaration block collapse into one comma-joined
  rule (same as v1's merge-rules pass). It only merges adjacent rules, so the cascade is safe, and it applies to the
  atomic and `globalCss` layers. Same CSS, fewer bytes.
- **Grouped `@media` / `@supports`.** Rules that share a wrapper are grouped before they're written.
- **Modern breakpoint syntax.** Responsive conditions use range syntax, `@media (width >= Nrem)`, with px and em
  normalized to `rem`.
- **Container queries sort by size.** Theme container conditions keep mobile-first order across `width`, `inline-size`,
  `height`, and `block-size` (modern and legacy forms).
- **Eager compound variants.** Compound variants emit at build time as named classes in
  `@layer recipes.compound_variants` (v1 atomized them into utilities). Runtime combo classes still apply for dynamic
  usage. Set `optimize.smartCompoundVariants: true` to emit only extracted combinations.

### Config: `optimize`

v2 adds a top-level `optimize` object. It replaces common v1 `cssgen:done` hook cleanup:

```ts
export default defineConfig({
  optimize: {
    removeUnusedTokens: true, // drop unused `--*` from theme CSS
    removeUnusedKeyframes: true,
    smartCompoundVariants: true, // JIT compound variant CSS (default: all combos)
    treeshakeDesignSystem: true, // hydrate only DS modules you import (default: all)
  },
})
```

`hash` and `minify` are separate top-level keys. Branch on `process.env` in `panda.config.ts` if you only want those in
production.

### Extraction

- **Compiled-JSX extraction.** `css` props are picked up from compiled runtime helpers (`jsx(...)` / `_jsx(...)`), so
  React, Preact, Vue, Solid, and Qwik builds work — not just raw JSX source.
- **Cross-file static composition.** You can keep shared styles in another file and compose them with `css(...)`. v2
  folds named local imports when the value is static. Aliases, re-exports, object spreads, and Panda `.raw()` helpers
  work. Default imports, namespace imports, and runtime values are skipped.

  ```tsx
  // styles.ts
  import { css } from '../styled-system/css'

  export const button = css.raw({
    display: 'inline-flex',
    alignItems: 'center',
    px: '4',
    py: '2',
    rounded: 'md',
  })

  export const icon = css.raw({
    width: '4',
    height: '4',
    flexShrink: '0',
  })

  // button.tsx
  import { css } from '../styled-system/css'
  import { button, icon } from './styles'

  css(button, { bg: 'blue.500', color: 'white' })

  // ✅ Works inside nested selectors too
  css({
    '& svg': {
      ...icon,
      color: 'currentColor',
    },
  })
  ```

- **Recipe variant diagnostics.** Dynamic config-recipe variant props warn with `recipe_variant_dynamic` (JIT still
  emits base + `defaultVariants` only).
- **Custom utility `transform` grouping.** A custom utility whose `transform` returns a multi-declaration object emits
  one class keyed on the utility's `className` (like v1), instead of splitting into per-property atoms. Token
  resolution, `!important`, and conditions from the transform are kept, in atomic styles and recipes alike.

### Types: smaller `.d.ts` and `isolatedDeclarations`

`cva` / `sva` return types are keyed by a clean props type, not the full variant record. Annotate an exported recipe
with only its variant keys and keep the CSS out of your `.d.ts`:

```tsx
import { cva } from 'styled-system/css'
import type { RecipeRuntimeFn } from 'styled-system/types'

export const button: RecipeRuntimeFn<{ visual?: 'solid' | 'outline' }> = cva({
  base: { px: '4' },
  variants: {
    visual: {
      solid: {
        /* css */
      },
      outline: {
        /* css */
      },
    },
  },
})
```

The same works for `styled(tag, {...})` via `StyledComponent<Tag, Props>` and for `sva` via `SlotRecipeRuntimeFn`. This
unblocks `isolatedDeclarations` and shrinks declaration files when you export components with variants. See the
[Isolated declarations guide](https://panda-css.com/docs/guides/isolated-declarations) for the full set of patterns.

### `viewTransition()`

New: style the View Transitions API and get a stable bag class back.

```ts
import { viewTransition } from 'styled-system/css'

const slide = viewTransition({
  group: { animationDuration: '0.4s' },
  old: { opacity: 0 },
  new: { opacity: 1 },
})
```

```tsx
<ViewTransition name="hero" share={slide}>
  <img src="…" alt="…" />
</ViewTransition>
```

Panda owns the shared CSS; you still set `view-transition-name` yourself.

### Source transformation

Bundler plugins can now rewrite static `css()` / `cva()` calls in your source. It's opt-in:

```ts
// vite.config.ts
import pandacss from '@pandacss/vite'

pandacss({ transform: true })
```

Same flag in `@pandacss/webpack` and `@pandacss/rollup`. Without it, the plugins only handle CSS, codegen, and HMR.

---

## Breaking changes & migration

### ESM only

There is no CJS build. If your config or tooling used `require()`:

```js
// ❌ v1 (CJS)
const { defineConfig } = require('@pandacss/dev')

// ✅ v2 (ESM)
import { defineConfig } from '@pandacss/dev'
```

Set `"type": "module"`, use `.mjs`, or run through an ESM-aware bundler. `panda.config.ts` loads as ESM.

### `--cpu-prof` is now `--profile`

`--cpu-prof` is gone. Use `--profile` on any command — it sees time in the Rust engine, not only the Node side:

```bash
# ❌ v1
panda build --cpu-prof

# ✅ v2
panda build --profile
```

It writes `.panda/trace.json` (open in `chrome://tracing` or `ui.perfetto.dev`) and `.panda/timings.json` (per-span
totals and slowest files). See
[Profiling a slow build](https://panda-css.com/docs/references/cli#profiling-a-slow-build).

### MCP moved out of the CLI

MCP runs from its own package, `@pandacss/mcp`, with a `panda-mcp` binary:

```bash
# ❌ v1
panda mcp
panda init-mcp

# ✅ v2 — run it directly, nothing to install
npx -y @pandacss/mcp
# or
pnpm dlx @pandacss/mcp
```

`panda mcp` and `panda init-mcp` are gone.

### Packages folded into the engine

These v1 internals are gone — their work lives in `@pandacss/compiler` now. Drop direct imports of:

`@pandacss/core`, `@pandacss/extractor`, `@pandacss/generator`, `@pandacss/node`, `@pandacss/parser`,
`@pandacss/token-dictionary`, `@pandacss/is-valid-prop`, `@pandacss/logger`, `@pandacss/reporter`, the standalone plugin
packages, and the Astro `@pandacss/studio`.

If you only use `@pandacss/dev` plus Vite or PostCSS, you're fine.

Still published on beta: `@pandacss/dev`, `@pandacss/cli`, `@pandacss/compiler`, `@pandacss/compiler-wasm`,
`@pandacss/compiler-shared`, `@pandacss/config`, `@pandacss/postcss`, `@pandacss/vite`, `@pandacss/webpack`,
`@pandacss/rollup`, `@pandacss/types`, `@pandacss/preset-base`, `@pandacss/preset-panda`, `@pandacss/preset-typography`,
`@pandacss/mcp`.

### PostCSS plugin is experimental

`@pandacss/postcss` v2 is experimental in the beta. If it misbehaves, use the Vite plugin or `panda build` instead.

### Hooks moved to plugins

Hooks still exist. Put them on named plugins, not a root `hooks` object:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  plugins: [
    {
      name: 'local',
      hooks: {
        'parser:before': {
          filter: { id: '**/*.{jsx,tsx}' },
          handler: ({ content }) => content,
        },
      },
    },
  ],
})
```

Supported in the beta:

- `config:resolved`
- `preset:resolved`
- `parser:before`
- `codegen:prepare`
- `codegen:done`
- `cssgen:done`

Gone from v1:

- `context:created`
- `parser:after`
- `config:change`
- `tokens:created`
- `utility:created`
- similar v1 engine hooks
- `parser:before.configure(...)` (JSX match rules) — v2 `parser:before` only transforms file content

`cssgen:done` is observe-only. It runs after final CSS is produced (CLI, Vite, PostCSS) with
`{ artifact, content, path?, … }` and does not rewrite the string:

```ts
export default defineConfig({
  plugins: [
    {
      name: 'analytics',
      hooks: {
        'cssgen:done': ({ content, path }) => {
          report({ bytes: content.length, path })
        },
      },
    },
  ],
})
```

Used v1 `cssgen:done` to strip unused tokens or keyframes? Use `optimize.removeUnusedTokens` / `removeUnusedKeyframes`
instead. For other CSS transforms, run PostCSS after Panda.

### `createStyleContext` is now two helpers

`createStyleContext` is gone from `styled-system/jsx`. Use one helper per recipe kind:

- `createRecipeContext` — config recipe (`cva`). Returns `{ withContext }`.
- `createSlotRecipeContext` — slot recipe (`sva`). Returns `{ withRootProvider, withProvider, withContext }`.

```tsx
// ❌ v1 — one helper for both
import { createStyleContext } from 'styled-system/jsx'

const { withProvider, withContext } = createStyleContext(card)
const CardRoot = withProvider('div', 'root')
const CardTitle = withContext('h3', 'title')
```

```tsx
// ✅ v2 — slot recipe (sva)
import { createSlotRecipeContext } from 'styled-system/jsx'

const { withRootProvider, withProvider, withContext } = createSlotRecipeContext(card)
const CardRoot = withProvider('div', 'root')
const CardTitle = withContext('h3', 'title')

// ✅ v2 — config recipe (cva)
import { createRecipeContext } from 'styled-system/jsx'

const { withContext } = createRecipeContext(button)
const Button = withContext('button')
```

`withRootProvider` is new. Use it for the root of a slot recipe when the root doesn't render a slot of its own.

---

## CLI commands

| Command           | What it does                                                                                             |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| `panda init`      | Scaffold `panda.config.ts` and run the first codegen.                                                    |
| `panda dev`       | Watch files and rebuild the generated system and CSS.                                                    |
| `panda build`     | Generate the system and CSS once. Bare `panda` still runs this default build.                            |
| `panda check`     | Check generated files without writing. Use this in CI.                                                   |
| `panda doctor`    | Validate config/diagnostics and print a project summary (sources, artifacts, tokens, …).                 |
| `panda debug`     | Write bug-report artifacts under `<outdir>/debug`.                                                       |
| `panda codegen`   | Advanced: generate the `styled-system` output only.                                                      |
| `panda cssgen`    | Advanced: generate CSS only.                                                                             |
| `panda lib`       | Publish a design system (`panda/lib.json` + build info + preset). See [Design systems](#design-systems). |
| `panda buildinfo` | Write build-info JSON only. Prefer `panda lib` for libraries.                                            |

`panda inspect`, `panda validate`, and `panda info` are removed in v2. Use `panda doctor` (add `--json` for scripts).

Logging flags are consolidated: use `--log-level silent|error|warn|info|debug` instead of `--silent`, `--quiet`, or
`--verbose`. Shared CLI flags use kebab-case, including `--max-warnings`, `--watch-debounce`, `--trace-output`, and
`--trace-file`. `--profile` replaces v1's `--cpu-prof` (see [above](#--cpu-prof-is-now---profile)).

`panda init -i` and `panda init --interactive` run the setup wizard, as they did in v1. They do not change log
formatting. Use `--no-color` or `NO_COLOR` to disable colors in terminal output.

---

## CSS output for monorepos

`panda cssgen --minimal` emits package usage CSS (recipes + utilities) without duplicating reset, base, and tokens. Emit
the full stylesheet once from the app/root.

1. **App/root:** `panda build` or `panda cssgen` for the full stylesheet.
2. **Per package:** `panda cssgen --minimal` for local usage CSS.
3. **Published libraries:** `panda lib`, then consumers use `designSystem` (see [Design systems](#design-systems)).

v1's positional layer names (`preflight`, `global`, `tokens`, …) and positional glob override aren't in the v2 CLI yet.
For keyframes-only CSS, use the compiler API: `getKeyframeCss()` (v1 `panda cssgen keyframes`).

---

## Design systems

Ship a component library so apps share your tokens, recipes, and CSS without re-scanning your source. Replaces v1's
`panda ship`.

### Shipping a library

```sh
# Monorepo / publish source — inferred fallback files often point at ../src/...
panda lib

# Built-only package ("files": ["dist"]) — set fallback globs yourself (relative to lib outdir)
panda lib --files './**/*.{js,mjs}'
```

Default outdir is `dist`. Machine artifacts land under `panda/`:

```txt
dist/panda/lib.json
dist/panda/buildinfo.json
dist/panda/preset.mjs
```

`panda lib` syncs package `exports` for:

- `./panda/*` → machine artifacts (consumers resolve `@acme/ds/panda/lib.json`)
- styled-system roots the package actually emitted (`./css`, `./recipes`, `./patterns`, `./jsx`, …) for overlay
  re-exports

Build info is what consumers hydrate; the preset carries tokens, recipes, and patterns. Manifest `preset` / `buildInfo`
paths are relative to `panda/`; fallback `files` are relative to the lib outdir (`dist/`).

Fallback `files` are only used when build info is missing or stale. Without `--files`, they're inferred from the scan.
If package.json only publishes `dist`, inferred `../src/...` paths won't ship — `panda lib` drops them and warns.
`--files` skips that filter. You own the source→dist mapping; Panda won't guess it.

Do not point a public `./preset` export at these machine files. Keep authoring presets as your own package API; Panda
only owns `./panda/*`.

### Using it in an app

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  designSystem: '@acme/design-system',
  include: ['./src/**/*.{ts,tsx}'],
})
```

Panda resolves `@acme/design-system/panda/lib.json`, merges the preset (and any parent), and applies the build info. You
don't set `importMap` or put build info in `include` — `designSystem` is enough.

Run `panda build` (or `panda codegen`) after wiring it. Import from your local `outdir`:

```ts
import { css } from '../styled-system/css'
```

With a compatible design system, local codegen can virtualize DS-owned modules (re-export from the package) and only
emit app deltas. Prefer the local outdir import either way — that path carries merged types when you extend tokens or
recipes. See [`design-notes/virtual-styled-system.md`](design-notes/virtual-styled-system.md).

### Chaining libraries

In a chain (`base → examples → components → app`), each package runs `panda lib` on its own source. Parent atoms stay in
the parent; consumers compose the chain through `designSystem`.

### Stamping a peer range

The peer range in the manifest comes from your `@pandacss/dev` peer. `workspace:`, `catalog:`, and `npm:` become a
portable range. Override with `--panda <range>` when you need an exact stamp:

```sh
panda lib --panda '^2.0.0'
```

### Known gaps

- **Package-root types.** Prefer the local `outdir` import above. `@acme/ds/css` can fail typechecking even when CSS is
  fine. Re-run local codegen so merged tokens land in `outdir`.
- **Missing tokens.** A token path the library doesn't define still emits as literal CSS with no build warning. Types
  reject it. See [`design-notes/design-system-manifest.md`](design-notes/design-system-manifest.md).

---

## Still being finalized

Known gaps in the beta. Expect them to change before stable:

- **Studio.** The Astro-based `@pandacss/studio` is gone. A lighter, CLI-generated studio (token and color views without
  a separate Storybook) is planned.
- **Some presets and plugins.** A few v1 community presets (`preset-atlaskit`, `preset-open-props`) and standalone
  plugins aren't in the beta. Check Rust-engine coverage before you rely on them.
- **Typography preset.** Use first-party `@pandacss/preset-typography` instead of community
  `pandacss-preset-typography`. Default size is `md` (not `base`).
- **CSS minification.** `minify: true` works in the native emitter; full parity with the v1 LightningCSS path is still
  open.
- **PostCSS plugin.** Experimental (above).

---

## Feedback

Found a bug? Open an issue with a `panda debug` dump (`panda debug` → `<outdir>/debug`). For a slow build, add
`--profile` so the dump includes `trace.json` and `timings.json`.

- Issues: <https://github.com/chakra-ui/panda/issues>
- Docs: <https://panda-css.com>
