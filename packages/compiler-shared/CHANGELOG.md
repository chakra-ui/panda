# @pandacss/compiler-shared

## 2.0.0-beta.7

## 2.0.0-beta.6

### Minor Changes

- b5a620d: Add `panda lib` to package a Panda design system.

  It scans your library source, writes `panda.lib.json`, `panda.buildinfo.json`, and `panda.preset.mjs`, then syncs the
  package exports. It can also run in watch mode.

  Consumers also get token conflict warnings when the app and design system define the same token path; the app value
  wins. If a library's build info is stale, Panda re-extracts its manifest `files` instead of failing the build.

- 7b71a43: Adopt a published design system with `designSystem: '@acme/ds'`.

  Panda reads the library's `panda.lib.json`, merges its preset below your config, and reuses its pre-extracted styles.
  If the design system needs a different Panda major version, Panda reports a clear error.

### Patch Changes

- 8a936bd: Add `panda analyze` reports. You can write JSON, open a static HTML report, or run the live report UI.
- 82e7811: Add `compiler.designSystem` helpers for `panda.lib.json` manifests.

  The new helpers create, validate, load, and order design-system manifests so consumers can adopt a library through the
  `designSystem` config field.

## 2.0.0-beta.5

## 2.0.0-beta.4

### Patch Changes

- 23580df: Expose lint-friendly inspection data from `inspectFileSource`, including extracted calls, JSX entries, token
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

## 2.0.0-beta.3

## 2.0.0-beta.2

### Minor Changes

- 0b77f58: Skip rewriting generated files when the content is unchanged, so watch mode no longer bumps mtimes and
  triggers extra reloads/rebuilds for no-op codegen and CSS writes.

  The compiler write APIs now use object params consistently:

  - `writeArtifacts({ outdir, cwd, forceImportExtension, artifacts })`
  - `writeCss({ outfile, cwd, emitLayerDeclaration })`
  - `writeSplitCss({ outdir, cwd })`

## 2.0.0-beta.1

## 2.0.0-beta.0

### Patch Changes

- 742d649: Fix custom utility `transform` callbacks being decomposed instead of merged in the v2 engine.

  A custom utility whose `transform` returns a multi-declaration object now emits a single class keyed on the utility's
  `className` (matching the legacy engine) instead of shattering into separate per-property atoms. This restores:

  - **Grouping** — `spaceX: { className: 'space-x', transform: (v) => ({ marginLeft: v, marginRight: v }) }` used as
    `css({ spaceX: '4' })` emits `.space-x_4 { margin-left: …; margin-right: … }`.
  - **Token resolution** — the `values` category is resolved before the callback runs (`boxColor: 'red'` →
    `var(--colors-red)`).
  - **`!important`** — preserved through the transform result.
  - **Conditions returned by the transform** — `_hover`/child selectors lower to real selectors.

  Recipes that exercise utility transforms get the same token-resolution and nested-condition fix.
