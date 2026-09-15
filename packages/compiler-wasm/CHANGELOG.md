# @pandacss/compiler-wasm

## 2.0.0-beta.17

### Minor Changes

- 5b9a056: Add `firstThatWorks()` for ordered CSS value fallbacks, so one property can carry a modern value and a
  supported one:

  ```ts
  import { css, firstThatWorks } from 'styled-system/css'

  css({ color: firstThatWorks('oklch(55% 0.18 250)', '#0057b8') })
  ```

  ```css
  .c_firstThatWorks\(oklch\(55\%_0\.18_250\)\,_\#0057b8\) {
    color: #0057b8;
    color: oklch(55% 0.18 250);
  }
  ```

  Write the value you want first, as in StyleX. Members are typed by the property they sit in, so they autocomplete and
  `strictTokens` still applies. Config recipes import `firstThatWorks` from `@pandacss/dev`, or write the
  `firstThatWorks(a, b)` value form directly.

### Patch Changes

- 8d29caa: Reuse cross-file analysis across `parseFiles()` batches so shared imported values are read and folded once
  per batch.
- 323af68: Reuse parsed source paths when registering bundler watch files, avoiding a second full project scan during
  startup. Keep tracked paths in sync when explicitly parsed files are deleted.
- 55cab2b: Reduce allocations during CSS call and JSX extraction by reusing owned style keys and values.
- bb47c38: Speed up JSX extraction for JavaScript and TypeScript files by skipping template scans reserved for Vue,
  Svelte, and Astro files.
- Updated dependencies [597d2cb]
- Updated dependencies [597d2cb]
- Updated dependencies [5b9a056]
- Updated dependencies [1ca20ab]
- Updated dependencies [323af68]
  - @pandacss/compiler-shared@2.0.0-beta.17
  - @pandacss/types@2.0.0-beta.17

## 2.0.0-beta.16

### Major Changes

- ef14fc5: Remove the `syntax` config option and the `template-literal` authoring mode. Drop `syntax` from your config
  and the `--syntax` flag from `panda init`, and write styles with the object syntax: `css({ color: 'red' })` instead of
  `` css`color: red` ``.

### Minor Changes

- dea1ef5: Add a `keyframes()` factory to `styled-system/css` for inline, component-local animations.

  `keyframes({ from: {...}, to: {...} })` returns a `kf_…` animation name and emits its `@keyframes` block, tree-shaken
  to what a build actually references through `animationName` or the `animation` shorthand. Object form only — a bare
  `animationName: 'spin'` already resolves a `theme.keyframes` entry, so there is no named form. Shared, design-system
  animations still belong in `theme.keyframes`.

- c58d45d: Add a `positionTry()` factory to `styled-system/css` and a `theme.positionTry` key for named CSS
  anchor-positioning fallbacks, and remove `globalPositionTry`.

  `positionTry('bottom')` or `positionTry({ top: 'anchor(bottom)' })` returns the dashed-ident for
  `positionTryFallbacks` and emits the `@position-try` block, tree-shaken to what a build uses. Move `globalPositionTry`
  entries to `theme.positionTry` and reference them through the factory. A block that must emit unconditionally with a
  hand-authored name belongs in a plain `.css` file.

### Patch Changes

- f583fb9: Merge the `css` prop over the style props beside it, so one declaration wins instead of two classes whose
  winner depended on stylesheet order. Shorthands normalize first, so `padding` and `p` collide the way they do at
  runtime.

  ```tsx
  // before: className="color_blue color_red", renders red
  // after:  className="color_blue", renders blue
  <Box color="red" css={{ color: 'blue' }} />
  ```

  Generated CSS can shrink: a rule whose only source was the losing side of a collision is no longer emitted.

- 6b04d94: Ignore watcher add and change events for unknown paths outside the configured source globs. Explicitly
  registered and design-system sources remain refreshable.
- dfb17b2: Fix `Driver.parseFiles()` retaining atoms from source files removed since the previous scan. Full-project
  rescans now reconcile scan- and watcher-owned files, including recovery from dropped watcher events.
- 84720fc: Re-extract files with unresolved cross-file imports when the missing module is created during watch mode.
- c3702af: Treat condition props like `_hover`, CSS variables, and `&`/`@` selectors as style props on JSX components,
  so they become classes instead of DOM attributes.
- ca9bb58: `parseFiles` now returns a report for every requested path. A file that cannot be read keeps its last parsed
  styles and reports a `source_not_found` or `source_read_failed` warning instead of being silently skipped.
- f583fb9: Keep the component when transforming JSX elements listed in a recipe's `jsx` option. That list tracks
  elements so their variants reach the stylesheet — the component is yours, and replacing `<Button size="sm" />` with a
  `div` dropped whatever it rendered. The element and its variant props now stay put; only style props fold into
  `className`.
- b2294ca: Resolve conditional variants in recipe calls and JSX at build time. `button({ size: cond ? 'sm' : 'lg' })`
  now emits a class ternary instead of applying both sizes, and several conditional variants resolve into a decision
  tree that gets defaults and compound variants right. Usages that still can't resolve to one class list are left for
  the runtime.
- af261f5: Fix watch CSS staying stale when a file you import a value from changes. Importers are re-extracted,
  including through re-exports, and only when the imported file's content actually changed.
- 9da80e1: Refresh cached cross-file exports when the resolved module itself changes, is deleted, or is recreated.
  Long-lived compiler sessions no longer reuse stale direct exports when re-extracting an importer.
- bcbcb22: Update the internal transform cache to `lru` 0.18.4, which fixes upstream Rust soundness issues.
- Updated dependencies [dfb17b2]
- Updated dependencies [dea1ef5]
- Updated dependencies [c58d45d]
- Updated dependencies [af261f5]
- Updated dependencies [ef14fc5]
  - @pandacss/compiler-shared@2.0.0-beta.16
  - @pandacss/types@2.0.0-beta.16

## 2.0.0-beta.15

### Minor Changes

- e18eeb3: Add `theme.viewTransitions` so a preset can name shared view-transition bags. Call `viewTransition('slide')`
  and Panda inlines `"vt_slide"`. Unused names stay out of the CSS.

### Patch Changes

- 8b43347: Semantic colors that set only conditional values (`_light`/`_dark`, no `base`) now join their `colorPalette`.
  Before, `bg: 'colorPalette.solid'` fell through to the raw string when `blue.solid` had no `base` value, so adding a
  `base` was the only workaround.
- 7c8a215: Extract style props from `styled` `defaultProps` on inline factories, including Solid function accessors.
  Recipe `defaultProps` also resolve through `recipes.button` and local aliases. Analyze and inspect report those usages
  too.
- Updated dependencies [8b43347]
- Updated dependencies [ec65db3]
- Updated dependencies [02bd0ad]
- Updated dependencies [e18eeb3]
- Updated dependencies [2d5d152]
  - @pandacss/compiler-shared@2.0.0-beta.15
  - @pandacss/types@2.0.0-beta.15

## 2.0.0-beta.14

### Patch Changes

- @pandacss/compiler-shared@2.0.0-beta.14
- @pandacss/types@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- @pandacss/compiler-shared@2.0.0-beta.13
- @pandacss/types@2.0.0-beta.13

## 2.0.0-beta.12

### Patch Changes

- @pandacss/compiler-shared@2.0.0-beta.12
- @pandacss/types@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- @pandacss/compiler-shared@2.0.0-beta.11
- @pandacss/types@2.0.0-beta.11

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
