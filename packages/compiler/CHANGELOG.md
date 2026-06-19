# @pandacss/compiler

## 2.0.0-beta.3

### Patch Changes

- 2117c7a: Improve generated style prop types for native CSS values and Panda utilities.

  Utility shorthands like `bg`, `bgColor`, and `color` now accept the matching native CSS values when `strictTokens` is
  off. Keyframe steps also use the same style object types as global CSS.

- 1d1ec6c: Trim surrounding whitespace before generating class names, so cssgen and runtime `css()` produce the same
  class for values like `'0 auto '`.
- 21dc46a: Fix several nested arbitrary selector edge cases.

  - Keep `&` intact inside quoted attribute selector values, like `[data-category="sound & vision"]`.
  - Keep parent selectors like `&:last-child` attached to the parent when followed by a nested descendant such as
    `& .divider`.
  - Scope comma selector members without `&` as descendants.
  - Wrap combinator parents in `:is()` when a nested selector contains multiple `&` tokens.

- 6a61a2d: Fix generated types for recipes with no variants.

  Variant-less recipes no longer add a broad string index signature, so `defaultProps` and `createSlotRecipeContext`
  providers accept valid non-variant props again.

- 376d6f2: Improve parse handling during extraction.

  - `.astro` frontmatter with a top-level `return` now extracts correctly.
  - Files Panda can't fully parse now warn instead of aborting the build. The warning explains that some styles may be
    missing. Use `--max-warnings 0` if you want parse warnings to fail CI.
  - @pandacss/compiler-shared@2.0.0-beta.3
  - @pandacss/config@2.0.0-beta.3

## 2.0.0-beta.2

### Minor Changes

- 0b77f58: Skip rewriting generated files when the content is unchanged, so watch mode no longer bumps mtimes and
  triggers extra reloads/rebuilds for no-op codegen and CSS writes.

  The compiler write APIs now use object params consistently:

  - `writeArtifacts({ outdir, cwd, forceImportExtension, artifacts })`
  - `writeCss({ outfile, cwd, emitLayerDeclaration })`
  - `writeSplitCss({ outdir, cwd })`

### Patch Changes

- bc39e0f: Fix cssgen dropping the leading dash on vendor-prefixed property names, so the class (and the CSS property)
  never matched the runtime.

  A vendor-prefixed property is authored PascalCase — `WebkitBackgroundClip`, `WebkitTextFillColor`, `MozAppearance`.
  The runtime `css()` hyphenates these with `property.replace(/[A-Z]/g, "-$&").toLowerCase()`, which prepends a dash to
  _every_ uppercase including the first → `-webkit-background-clip`, and names the class `-webkit-background-clip_text`.
  The native engine's `hyphenate_property` suppressed the dash on the first letter (`index > 0`), producing
  `webkit-background-clip` — so cssgen wrote `.webkit-background-clip_text { webkit-background-clip: text }`, a class
  the runtime never emits _and_ an invalid (de-prefixed) CSS property. The gradient-text pattern
  (`WebkitBackgroundClip: 'text'` + `WebkitTextFillColor: 'transparent'`) silently did nothing.

  `hyphenate_property` now prepends the dash to every uppercase letter (matching the runtime and legacy Panda's
  `wordRegex`/`/[A-Z]/g`), so `WebkitBackgroundClip` → `-webkit-background-clip` and `MozAppearance` →
  `-moz-appearance`. camelCase props are unchanged (`backgroundColor` → `background-color`), and the `msTransform` →
  `-ms-transform` special case is preserved.

- ac3eba5: Fix object-map utility values generating CSS selectors that do not match runtime class names.

  Authored literal values now keep their literal class segment, e.g. `minHeight: '100vh'` emits `.min-h_100vh` instead
  of reverse-mapping to `.min-h_screen`.

- adc8d7c: Fix the runtime `css()` naming `!important` classes differently from cssgen, so the rule never matched.

  `css({ padding: '0 !important' })` put `p_0_!important` on the element — the runtime hashed the whole string
  (`withoutSpace('0 !important')`) — but cssgen wrote `.p_0\!` (it strips `!important` and marks the class with a
  trailing `!`). The two never matched, so the `!important` declaration silently never applied. Same for
  `zIndex: '1002 !important'`, `whiteSpace: 'nowrap !important'`, `color: 'red.500 !important'`, etc.

  The generated runtime now mirrors legacy Panda (and the native emitter): it detects `!important`, strips it before
  hashing the value, and appends a trailing `!` to the final class — `p_0!`, `z_1002!`, `c_red.500!` — exactly the class
  cssgen emits (`.p_0\!`). Adds `isImportant` / `withoutImportant` runtime helpers (matching `@pandacss/shared`'s
  `/\s*!(important)?/i`) and wires them into `createCssRuntime`'s `serializeCss`, so both `css({})` and `css\`\`` are
  fixed in one place.

- Updated dependencies [0b77f58]
  - @pandacss/compiler-shared@2.0.0-beta.2
  - @pandacss/config@2.0.0-beta.2

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
