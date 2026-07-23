# @pandacss/compiler-wasm

## 2.0.0-beta.10

### Minor Changes

- d2bea8a: `css()` and JSX style props can resolve simple pure helpers — local or imported arrow functions, function
  declarations, and IIFEs. `token()` comparisons inside those helpers resolve too.

  ```ts
  const pad = (n: number) => ({ padding: `${n}px` })
  css(pad(4)) // extracted
  ```

- f8027f3: Fix CSS cascade order, token pruning, and conditional JSX spreads where a later static prop overrides a
  spread. Design-system tree-shaking now runs before every CSS read/write path, not only `cssgen` / `writeCss`.

  `getSplitCss()` is a breaking shape change for direct callers:

  ```ts
  // before
  const files = compiler.getSplitCss()

  // after
  const { files, diagnostics } = compiler.getSplitCss()
  ```

- ebe9f5b: Add `getKeyframeCss()` to emit theme `@keyframes` without token vars or other layers.
- 52e84e6: Add native cascade-layer polyfill via `polyfill` / `--polyfill` (no PostCSS plugin required).
- a79c917: Opt into `optimize.treeshakeDesignSystem` to hydrate only the design-system modules your app imports, instead
  of the whole build-info artifact.
- 2714583: Add `viewTransition()` for the View Transitions API. Pass slot styles, get a stable `vt_*` bag class, and
  Panda emits the matching `::view-transition-*` rules. Import from `styled-system/css`. You still set unique
  `view-transition-name` values at runtime — Panda only owns the shared CSS. Design-system build info carries the bags
  so apps hydrate them without re-extracting.

  ```ts
  import { viewTransition } from 'styled-system/css'

  const slide = viewTransition({
    group: { animationDuration: '0.4s' },
    old: { opacity: 0 },
    new: { opacity: 1 },
  })
  ```

  ```tsx
  // React / Next
  import { ViewTransition } from 'react'

  ;<ViewTransition name="hero" share={slide}>
    <img src="…" alt="…" />
  </ViewTransition>
  ```

  ```html
  <!-- Astro -->
  <img class="{slide}" transition:name="hero" src="…" alt="…" />
  ```

  ```tsx
  // Solid / Nuxt — framework starts the transition; you attach name + bag class
  <img class={slide} style={{ viewTransitionName: 'hero' }} src="…" alt="…" />
  ```

### Patch Changes

- Updated dependencies [05e085d]
- Updated dependencies [f8027f3]
- Updated dependencies [ebe9f5b]
- Updated dependencies [52e84e6]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/compiler-shared@2.0.0-beta.10
  - @pandacss/types@2.0.0-beta.10

## 2.0.0-beta.9

### Patch Changes

- Add `no-primitive-token` (and inspection metadata) so you can require semantic tokens when a matching category exists.
- Design-system build info loads more reliably when packages are nested, files are stale, or options do not match. You
  get clearer errors for token conflicts and mismatched config.
- Remove the unused `designSystem.resolveChain` API. Chain resolution already happens in the config loader.

## 2.0.0-beta.6

### Patch Changes

- Add `compiler.designSystem` helpers for `panda.lib.json` manifests.

  The new helpers create, validate, load, and order design-system manifests so consumers can adopt a library through the
  `designSystem` config field.

- Only extract JSX style props when `jsxFramework` is configured.

  This prevents CSS from being generated for JSX components in projects that have not enabled JSX extraction.
  Function-call extraction is unchanged.

## 2.0.0-beta.4

### Patch Changes

- Fix `globalCss` and token-reference parity with extracted styles.

  - Expand composition props and nested utility transforms in `globalCss`.
  - Resolve token references in raw at-rule conditions.
  - Preserve `token(path, fallback)` fallbacks in emitted CSS variables.

- Expose lint-friendly inspection data from `inspectFileSource`, including extracted calls, JSX entries, token
  references, component entries, and style entries with safe local key/value spans. Style entries cover every
  style-writing form — `css()` (including the `css(a, b)` multi-argument merge), style props, responsive arrays,
  per-prop conditions, JSX `css` props (object **and** `css={[...]}` array forms), and recipe styles in `cva` / `sva` /
  `styled('div', { ... })` (`base`, `variants`, `compoundVariants`) — and carry per-leaf value spans so tooling can
  offer precise fixes everywhere. Each style entry also carries an `owner` (the enclosing call/JSX element) so tooling
  can group sibling properties from the same style block.

  `compiler.spec()` now reports deprecation richer: `tokens.deprecated` and `utilities.deprecated` are maps of name →
  deprecation (`true`, or the author's `deprecated: 'use X instead'` message), recipe definitions carry a `deprecated`
  flag, and recipes/slotRecipes are exposed as top-level `spec.recipes` / `spec.slotRecipes` (previously nested under
  `spec.recipes.recipes`).

  Add `compiler.suggestToken(prop, value)` — given a hardcoded value, returns the token to use (semantic tokens
  preferred over the primitives they reference, with hex and px/rem normalization), or `null`. Token references in
  inspection results also carry `isVar` (whether the call was `token.var(...)`).

## 2.0.0-beta.2

### Minor Changes

- Skip rewriting generated files when the content is unchanged, so watch mode no longer bumps mtimes and triggers extra
  reloads/rebuilds for no-op codegen and CSS writes.

  The compiler write APIs now use object params consistently:

  - `writeArtifacts({ outdir, cwd, forceImportExtension, artifacts })`
  - `writeCss({ outfile, cwd, emitLayerDeclaration })`
  - `writeSplitCss({ outdir, cwd })`

## 2.0.0-beta.0

### Minor Changes

- Emit native token CSS in the Rust stylesheet compiler and align the default `cssVarRoot` with JS output
  (`:where(:root, :host)`).

### Patch Changes

- Fix custom utility `transform` callbacks being decomposed instead of merged in the v2 engine.

  A custom utility whose `transform` returns a multi-declaration object now emits a single class keyed on the utility's
  `className` (matching the legacy engine) instead of shattering into separate per-property atoms. This restores:

  - **Grouping** — `spaceX: { className: 'space-x', transform: (v) => ({ marginLeft: v, marginRight: v }) }` used as
    `css({ spaceX: '4' })` emits `.space-x_4 { margin-left: …; margin-right: … }`.
  - **Token resolution** — the `values` category is resolved before the callback runs (`boxColor: 'red'` →
    `var(--colors-red)`).
  - **`!important`** — preserved through the transform result.
  - **Conditions returned by the transform** — `_hover`/child selectors lower to real selectors.

  Recipes that exercise utility transforms get the same token-resolution and nested-condition fix.
