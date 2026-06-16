# Panda CSS v2 — Beta Guide & Migration

> **Status:** v2 is in **beta** (`2.0.0-beta`). The authoring API you already know is stable; what changed lives underneath. This guide is for v1 users who want to try the beta or start migrating — and for new users who want to start a fresh project on v2.

> 🆕 **New to Panda?** Skip straight to [Get started (new project)](#get-started-new-project).

---

## Introducing Panda v2

Panda v2 keeps the framework you know — `css()`, recipes, patterns, tokens, conditions, JSX style props — and **rewrites the compiler hot path in Rust** on top of the [Oxc](https://oxc.rs) toolchain.

In v1, extraction and evaluation ran through `ts-morph` + `ts-evaluator` in Node. v2 replaces that pipeline with a native engine:

- **`@pandacss/compiler`** — a native NAPI binding around the Rust engine. This is the path the CLI and bundler integrations use.
- **`@pandacss/compiler-wasm`** — a `wasm-bindgen` build of the same engine for the browser (powers the playground and in-browser tooling).

Both consume the **same** Rust crates, so Node and browser builds share one source of truth for extraction and CSS emission.

**Why it matters**

- ⚡️ Faster, lighter extraction — single parse per file, no TypeScript program in the hot path.
- 🧱 One engine, two runtimes — identical output from native and wasm builds.
- 🪶 Smaller install — the `ts-morph`/`ts-evaluator` dependency tree is gone.
- 🎯 Same CSS contract — output is intentionally kept in parity with v1 (see [What changed](#what-changed-in-v2)).

> **Beta expectations:** the public authoring API is stable. Internal package layout, the exact Node floor, and a few CLI/tooling surfaces are still being finalized — see [Still being finalized](#still-being-finalized).

---

## Release channels

Panda v1 and v2 are published side by side on npm:

| Channel | Versions | Install tag |
| --- | --- | --- |
| **`latest`** | v1 — `1.x` (stable) | `@pandacss/dev` |
| **`beta`** | v2 — `2.0.0-beta` | `@pandacss/dev@beta` |

- Installing without a tag (`@pandacss/dev`) still gives you **stable v1** — your existing projects are not affected.
- v2 only arrives when you explicitly opt in with `@beta`.
- All `@pandacss/*` packages move in lockstep (fixed version group), so every published package shares the same `2.0.0-beta` version. Don't mix a v1 package with a v2 one.

---

## Try the beta

### 1. Requirements

- **ESM-only.** v2 ships ES modules only — there is no CommonJS build. Your project must be able to `import` Panda (use `"type": "module"`, `.mjs`, or a bundler/loader that consumes ESM). `require('@pandacss/dev')` will not work.
- **Modern Node.** Use an actively-supported Node (Node 20+; Node 22+ recommended). The exact `engines.node` floor is being pinned for the stable release — see [Still being finalized](#still-being-finalized).

### 2. Install

Add the beta to a project (most users only need `@pandacss/dev`):

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

Add integrations as needed (all on the same `@beta` tag):

```bash
pnpm add -D @pandacss/postcss@beta   # standalone PostCSS plugin (v2 compiler driver)
pnpm add -D @pandacss/vite@beta      # Vite plugin
```

> **Two ways to wire up PostCSS** — both valid:
> - **`@pandacss/postcss`** — the standalone plugin (key: `'@pandacss/postcss'`).
> - **`@pandacss/dev/postcss`** — a re-export of the same plugin, so you don't need a second install if you already have `@pandacss/dev` (this is what `panda init --postcss` scaffolds).

> Pin to an exact beta (`@pandacss/dev@2.0.0-beta.0`) if you want reproducible installs — `@beta` always resolves to the newest pre-release.

### 3. Build

On an **existing v1 project**, your `panda.config.ts` carries over — just regenerate:

```bash
panda          # codegen + cssgen in one pass
panda --watch  # rebuild on change
```

The `panda` / `pandacss` binaries are unchanged from v1. **Starting fresh?** See [Get started (new project)](#get-started-new-project).

---

## Get started (new project)

New to Panda? Here's the happy path on v2. (Already on v1? Jump to [migration](#breaking-changes--migration).)

### 1. Install

```bash
pnpm add -D @pandacss/dev@beta
```

Make sure your project resolves ESM — add `"type": "module"` to `package.json` if it isn't already there.

### 2. Initialize

`panda init` scaffolds a `panda.config.ts` and runs the first codegen into `styled-system/`. Handy flags:

```bash
panda init --postcss          # also write a postcss.config.cjs
panda init --gitignore        # add styled-system to .gitignore (on by default)
panda init --jsxFramework react   # generate JSX-aware helpers (react | preact | vue | solid | qwik)
panda init --outdir src/styled-system
```

### 3. Configure what to scan

In `panda.config.ts`, point `include` at the files you write styles in:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true, // CSS reset
  include: ['./src/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  outdir: 'styled-system',
})
```

### 4. Add Panda to your CSS

Add the cascade layers to your root stylesheet (e.g. `src/index.css`):

```css
@layer reset, base, tokens, recipes, utilities;
```

Process it with the PostCSS plugin (`panda init --postcss` writes this for you):

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {},
  },
}
```

### 5. Write styles

```tsx
import { css } from '../styled-system/css'

export const Button = () => (
  <button className={css({ bg: 'red.400', color: 'white', px: '4', py: '2', rounded: 'md' })}>
    Hello 🐼
  </button>
)
```

### 6. Build

```bash
panda          # one-shot codegen + cssgen
panda --watch  # rebuild on change
```

> The CLI generates types and helpers under `styled-system/`. Re-run `panda codegen` (or keep `--watch` running) whenever you change tokens, recipes, or patterns. For the full tutorial — recipes, patterns, conditions, theming — see the [official docs](https://panda-css.com).

---

## What changed in v2

The Rust engine targets **CSS-output parity** with v1. The user-facing differences below are the deliberate ones:

### CSS output

- **Native token CSS.** Token CSS variables are emitted by the Rust stylesheet compiler. The default `cssVarRoot` is aligned with v1 output: `:where(:root, :host)`.
- **Merged adjacent selectors.** Consecutive rules that share an identical declaration block are coalesced into one comma-joined rule (parity with v1's merge-rules pass). The merge is adjacency-only (cascade-safe) and applies to the atomic and `globalCss` layers — functionally identical CSS, just smaller.
- **Grouped `@media` / `@supports` emit.** Rules that share a media/supports wrapper are tree-grouped before being written.
- **Modern breakpoint syntax.** Responsive conditions normalize to range syntax — `@media (width >= Nrem)` — with px/em normalized to `rem`.
- **Container queries sort by size.** Container conditions (`@container (inline-size >= …)`) now sort by resolved length across every size axis (`width`, `inline-size`, `height`, `block-size`), in both modern (`>=`/`<`) and legacy (`min-*`/`max-*`) forms — fixing mobile-first cascade ordering for theme container breakpoints.
- **Eager compound variants.** Compound variants are emitted at build time by default; runtime combo classes still apply for dynamic usage. Opt into narrowing with `optimize.smartCompoundVariants: true` to emit only selected variant combinations instead of every permutation.

### Extraction

- **Compiled-JSX runtime extraction.** `css` props are now recognized from framework runtime helper output (the compiled `jsx(...)` / `_jsx(...)` calls), covering **React, Preact, Vue, Solid, and Qwik** builds — not just raw JSX source.
- **Custom utility `transform` grouping.** A custom utility whose `transform` returns a multi-declaration object emits a **single** class keyed on the utility's `className` (matching v1) instead of shattering into per-property atoms. Token resolution, `!important`, and conditions returned by the transform are all preserved — in atomic styles and recipes alike.

---

## Breaking changes & migration

### ESM-only (no CommonJS)

v2 drops the CJS build. If your config or tooling used `require()`:

```js
// ❌ v1 (CJS)
const { defineConfig } = require('@pandacss/dev')

// ✅ v2 (ESM)
import { defineConfig } from '@pandacss/dev'
```

Make sure the project resolves Panda as ESM — set `"type": "module"` in `package.json`, use `.mjs`, or rely on a bundler/loader that handles ESM. `panda.config.ts` is loaded as ESM.

### MCP moved out of the CLI

MCP execution now lives in its own package, **`@pandacss/mcp`**, with a dedicated `panda-mcp` binary:

```bash
# ❌ v1
panda mcp
panda init-mcp

# ✅ v2 — run the server directly, no install needed
npx -y @pandacss/mcp
# or
pnpm dlx @pandacss/mcp
```

The `panda mcp` and `panda init-mcp` bridge commands are removed.

### Packages removed / folded into the engine

Several v1 packages were internal to the old Node pipeline and **no longer exist** in v2 — their work moved into the Rust engine behind `@pandacss/compiler`. If you imported any of these directly, you'll need to remove those imports:

`@pandacss/core`, `@pandacss/extractor`, `@pandacss/generator`, `@pandacss/node`, `@pandacss/parser`, `@pandacss/token-dictionary`, `@pandacss/is-valid-prop`, `@pandacss/logger`, `@pandacss/reporter`, plus the standalone plugin packages and the Astro `@pandacss/studio`.

> Most apps only ever depend on `@pandacss/dev` (plus a bundler/postcss plugin), so this is a no-op for typical setups. It only bites if you reached into Panda's internals.

**Packages kept and published on the beta:**
`@pandacss/dev`, `@pandacss/cli`, `@pandacss/compiler`, `@pandacss/compiler-wasm`, `@pandacss/compiler-shared`, `@pandacss/config`, `@pandacss/postcss`, `@pandacss/vite`, `@pandacss/types`, `@pandacss/preset-base`, `@pandacss/preset-panda`, `@pandacss/mcp`.

### Experimental PostCSS plugin

`@pandacss/postcss` v2 is backed by the new compiler driver and is **experimental** during the beta. If you hit issues, the Vite plugin or the CLI build is the more battle-tested path right now.

---

## CLI commands

The beta command surface:

| Command | What it does |
| --- | --- |
| `panda` | **Default build** — runs codegen + cssgen in one driver pass. Flags: `--outdir`, `--outfile`, `--splitting`, `--clean`, `--check`, `--watch`. `--outdir` relocates both the generated system and the CSS file; codegen runs first so `--clean` wipes the outdir before CSS is written. |
| `panda init` | Scaffold `panda.config.ts` and run the first codegen. |
| `panda codegen` | Generate the `styled-system` output only. |
| `panda cssgen` | Generate the CSS only. |
| `panda debug` | Dump resolved config + per-file extraction for bug reports — writes `info.json`, `config.json`, `<file>.extract.json`, and the project `styles.css` under `<outdir>/debug`. Flags: `--outdir`, `--dry` (print to stdout), `--only-config`. |
| `panda inspect` | Inspect the resolved Panda artifacts. |
| `panda validate` | Validate config and tokens. |
| `panda buildinfo` | Emit build metadata. |

**Routing rule (important):** subcommands must come **first**.

```bash
panda codegen --cwd ./app   # ✅ subcommand, then flags
panda --watch               # ✅ leading flag → default build
panda --cwd ./app codegen   # ❌ first token is read as a flag → runs default build
```

A leading **flag** runs the default build (`panda --watch`); a leading **word** (or `--help`) goes to the subcommand dispatcher.

---

## Still being finalized

These are known gaps in the beta — expect changes before stable:

- **Exact Node floor.** v2 is ESM-only and targets modern Node, but the precise `engines.node` minimum is still being pinned. Use Node 20+ (22+ recommended) in the meantime.
- **Studio.** The Astro-based `@pandacss/studio` is removed; a lighter, CLI-generated studio (token/color visualization without a separate Storybook) is planned.
- **Removed presets/plugins.** Some v1 community presets (e.g. `preset-atlaskit`, `preset-open-props`) and standalone plugins are not part of the beta. Verify Rust-engine coverage before relying on them.
- **CSS minification parity.** Native CSS emission is done; full minify parity with the v1 LightningCSS path is an open follow-up.
- **PostCSS plugin.** Experimental (see above).
- **CLI `[files]` positional override.** The v1 positional include override for `panda build` isn't wired yet — the build uses the config `include`.

---

## Feedback

v2 is a beta — bug reports are exactly what it needs. When filing an issue, attach a `panda debug` dump (`panda debug` → `<outdir>/debug`) so maintainers can reproduce.

- Issues: <https://github.com/chakra-ui/panda/issues>
- Docs: <https://panda-css.com>
