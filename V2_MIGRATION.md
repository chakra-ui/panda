# Panda CSS v2 — beta guide and migration

> v2 is in beta (`2.0.0-beta`). You write the same Panda you already know — `css()`, recipes, patterns, tokens,
> conditions, JSX props. What changed is the engine underneath. This guide is for v1 users trying the beta, and for
> anyone starting fresh on v2.
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

The authoring API is stable. The internal package layout and a few CLI surfaces are not finished yet — see
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
```

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
> scales, no `_hover`/`_active` conditions). `panda init` scaffolds this line and installs both presets for you.

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
- **Container queries sort by size.** Container conditions sort by resolved length across every axis (`width`,
  `inline-size`, `height`, `block-size`), in both modern (`>=`/`<`) and legacy (`min-*`/`max-*`) forms. This fixes
  mobile-first ordering for theme container breakpoints.
- **Eager compound variants.** Compound variants emit at build time by default; runtime combo classes still apply for
  dynamic usage. In v2 they become **named classes** in `@layer recipes.compound_variants` (v1 atomized compound `css`
  into `@layer utilities` and merged at runtime). Set `optimize.smartCompoundVariants: true` to emit only extracted
  combinations instead of every permutation.

### Config: `optimize`

v2 adds a top-level `optimize` object. It replaces common v1 `cssgen:done` hook cleanup:

```ts
export default defineConfig({
  optimize: {
    removeUnusedTokens: true, // drop unused `--*` from theme CSS
    removeUnusedKeyframes: true,
    smartCompoundVariants: true, // JIT compound variant CSS (default: all combos)
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

v2 reshapes the `cva` and `sva` return types so they're keyed by a clean props type, not the full variant record. That
means you can annotate an exported inline recipe with only its variant keys and keep the CSS out of your `.d.ts`:

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

Several v1 packages were internals of the old Node pipeline. They no longer exist in v2 — that work moved into the Rust
engine behind `@pandacss/compiler`. Remove any direct imports of:

`@pandacss/core`, `@pandacss/extractor`, `@pandacss/generator`, `@pandacss/node`, `@pandacss/parser`,
`@pandacss/token-dictionary`, `@pandacss/is-valid-prop`, `@pandacss/logger`, `@pandacss/reporter`, the standalone plugin
packages, and the Astro `@pandacss/studio`.

Most apps only depend on `@pandacss/dev` plus a bundler or PostCSS plugin, so this changes nothing for them. It only
bites if you reached into Panda's internals.

Kept and published on the beta: `@pandacss/dev`, `@pandacss/cli`, `@pandacss/compiler`, `@pandacss/compiler-wasm`,
`@pandacss/compiler-shared`, `@pandacss/config`, `@pandacss/postcss`, `@pandacss/vite`, `@pandacss/types`,
`@pandacss/preset-base`, `@pandacss/preset-panda`, `@pandacss/mcp`.

### PostCSS plugin is experimental

`@pandacss/postcss` v2 runs on the new compiler driver and is experimental during the beta. If it gives you trouble, the
Vite plugin or the CLI build is the steadier path right now.

### Engine hooks removed

v1 hooks (`cssgen:done`, `context:created`, `parser:after`, `config:change`, and others) don't run in v2. Use
`optimize.removeUnusedTokens` / `removeUnusedKeyframes` for unused theme CSS cleanup, or a PostCSS step after Panda for
custom transforms.

### `createStyleContext` is now two helpers

`createStyleContext` is removed from the generated `styled-system/jsx`. Two helpers replace it, one per recipe kind:

- `createRecipeContext` — for a config recipe (`cva`). Returns `{ withContext }`.
- `createSlotRecipeContext` — for a slot recipe (`sva`). Returns `{ withRootProvider, withProvider, withContext }`.

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

| Command           | What it does                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `panda init`      | Scaffold `panda.config.ts` and run the first codegen.                                        |
| `panda dev`       | Watch files and rebuild the generated system and CSS.                                        |
| `panda build`     | Generate the system and CSS once. Bare `panda` still runs this default build.                |
| `panda check`     | Check generated files without writing. Use this in CI.                                       |
| `panda info`      | Print project/compiler info: config path, sources, artifacts, conditions, tokens, utilities. |
| `panda doctor`    | Check config loading and compiler diagnostics.                                               |
| `panda debug`     | Write bug-report artifacts under `<outdir>/debug`.                                           |
| `panda codegen`   | Advanced: generate the `styled-system` output only.                                          |
| `panda cssgen`    | Advanced: generate CSS only.                                                                 |
| `panda buildinfo` | Advanced: emit design-system build metadata.                                                 |

`panda inspect` and `panda validate` are removed in v2. Use `panda info` and `panda doctor`.

Logging flags are consolidated: use `--log-level silent|error|warn|info|debug` instead of `--silent`, `--quiet`, or
`--verbose`. Shared CLI flags use kebab-case, including `--max-warnings`, `--watch-debounce`, `--trace-output`, and
`--trace-file`.

---

## CSS output for monorepos

v2 keeps `panda cssgen --minimal` for packages that should emit usage CSS without duplicating foundation CSS. It writes
recipes and utilities only; reset, base, and tokens should be emitted once by the app/root build.

Recommended monorepo workflow:

1. **App/root:** run a normal `panda build` or `panda cssgen` to emit the full stylesheet once.
2. **Per package:** run `panda cssgen --minimal` to emit package-local usage CSS.
3. **Published design systems:** ship `panda buildinfo` and hydrate in consumers (see `design-notes/build-info.md`).

The v1 positional layer names (`preflight`, `global`, `tokens`, …) and positional glob override are not part of the v2
CLI surface yet.

---

## Still being finalized

Known gaps in the beta. Expect them to change before stable:

- **Studio.** The Astro-based `@pandacss/studio` is gone. A lighter, CLI-generated studio (token and color views without
  a separate Storybook) is planned.
- **Some presets and plugins.** A few v1 community presets (`preset-atlaskit`, `preset-open-props`) and standalone
  plugins aren't in the beta. Check Rust-engine coverage before you rely on them.
- **CSS minification.** `minify: true` works in the native emitter; full parity with the v1 LightningCSS path is still
  open.
- **PostCSS plugin.** Experimental (above).

---

## Feedback

It's a beta, so bug reports are the most useful thing you can send. Attach a `panda debug` dump (`panda debug` →
`<outdir>/debug`) so maintainers can reproduce.

- Issues: <https://github.com/chakra-ui/panda/issues>
- Docs: <https://panda-css.com>
