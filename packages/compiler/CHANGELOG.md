# @pandacss/compiler

## 2.0.0-beta.1

### Patch Changes

- Updated dependencies [349e7ef]
- Updated dependencies [07eafef]
  - @pandacss/config@2.0.0-beta.1
  - @pandacss/compiler-shared@2.0.0-beta.1

## 2.0.0-beta.0

### Minor Changes

- cc30235: Emit native token CSS in the Rust stylesheet compiler and align the default `cssVarRoot` with JS output
  (`:where(:root, :host)`).

### Patch Changes

- b567ae6: Improve compiled JSX extraction so `css` props are recognized from framework runtime helper output, including
  React, Preact, Vue, Solid, and Qwik builds.
- 8e66595: Merge adjacent selectors that share an identical declaration block into one comma-joined rule (parity with
  the legacy engine's merge-rules pass).

  The v2 native emitter now coalesces consecutive rules with the same declaration block — e.g.
  `css({ _hover: { color: 'red' } })` + `css({ '[data-x] &': { color: 'red' } })` emits one
  `.hover\:color_red:hover, [data-x] .…:color_red { color: red }` instead of two separate rules. The merge is
  adjacency-only (cascade-safe, mirroring lightningcss's `CssRuleList::minify`) and runs at the IR level — no CSS
  parser, no new dependency, identical in the native and wasm builds. It covers the atomic and globalCss layers. CSS is
  functionally equivalent, just smaller.

- 939a3d9: Sort container queries by their resolved `inline-size`, like media queries.

  The cascade sorter only recognized `width`-based queries, so theme container conditions (which emit
  `@container (inline-size >= …)`) fell back to raw-string ordering — e.g. `inline-size >= 16rem` sorted before
  `inline-size >= 8rem`, inverting the mobile-first cascade. The query parser now resolves direction + length across
  every size axis (`width`, `inline-size`, `height`, `block-size`), in both modern (`>=`/`<`) and legacy
  (`min-*`/`max-*`) forms, so container breakpoints sort by magnitude.

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
  - @pandacss/config@2.0.0-beta.0
