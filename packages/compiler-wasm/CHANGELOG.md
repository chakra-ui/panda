# @pandacss/compiler-wasm

## 2.0.0-beta.2

### Minor Changes

- 0b77f58: Skip rewriting generated files when the content is unchanged, so watch mode no longer bumps mtimes and
  triggers extra reloads/rebuilds for no-op codegen and CSS writes.

  The compiler write APIs now use object params consistently:

  - `writeArtifacts({ outdir, cwd, forceImportExtension, artifacts })`
  - `writeCss({ outfile, cwd, emitLayerDeclaration })`
  - `writeSplitCss({ outdir, cwd })`

### Patch Changes

- Updated dependencies [0b77f58]
  - @pandacss/compiler-shared@2.0.0-beta.2

## 2.0.0-beta.1

### Patch Changes

- @pandacss/compiler-shared@2.0.0-beta.1

## 2.0.0-beta.0

### Minor Changes

- cc30235: Emit native token CSS in the Rust stylesheet compiler and align the default `cssVarRoot` with JS output
  (`:where(:root, :host)`).

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

- Updated dependencies [742d649]
  - @pandacss/compiler-shared@2.0.0-beta.0
