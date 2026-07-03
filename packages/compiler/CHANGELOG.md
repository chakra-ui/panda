# @pandacss/compiler

## 2.0.0-beta.8

### Patch Changes

- 72580e5: Fix PostCSS HMR style updates.

  Component edits now keep previous atoms available during refresh, and design-system source fallback files refresh
  through the driver instead of waiting for a restart.

- Updated dependencies [72580e5]
  - @pandacss/compiler-shared@2.0.0-beta.8
  - @pandacss/config@2.0.0-beta.8

## 2.0.0-beta.7

### Patch Changes

- 97d142a: Fix generated token types when a category has no tokens. A config with missing or empty categories no longer
  collapses `TokenValue` to bare `string`, so native CSS value autocomplete (e.g. `currentColor`) stays intact.
- 0a11fda: Fix hot module reloading with the PostCSS integration (`@pandacss/dev/postcss`). Editing a component now
  updates its styles live, instead of leaving them stale until you restart the dev server.
  - @pandacss/compiler-shared@2.0.0-beta.7
  - @pandacss/config@2.0.0-beta.7

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

- d075c2b: Only extract JSX style props when `jsxFramework` is configured.

  This prevents CSS from being generated for JSX components in projects that have not enabled JSX extraction.
  Function-call extraction is unchanged.

- 86504d6: Add a WASI compiler fallback for WebContainer-based environments like StackBlitz.
- Updated dependencies [8a936bd]
- Updated dependencies [82e7811]
- Updated dependencies [b5a620d]
- Updated dependencies [7b71a43]
  - @pandacss/compiler-shared@2.0.0-beta.6
  - @pandacss/config@2.0.0-beta.6

## 2.0.0-beta.5

### Patch Changes

- a9c6e47: Fix v2 CSS-output regressions in `globalCss` and nested style objects:

  - Bare element selectors (e.g. `'.article': { h2: { ... } }`) now nest as descendants instead of being dropped.
  - Comma-separated selector groups now distribute the parent to every member (`h2, h3, h4` →
    `.article h2, .article h3, .article h4`).
  - A composition (`textStyle`/`layerStyle`/`animationStyle`) combined with explicit properties now merges into one
    block, so a sibling override (e.g. `fontFamily`) wins by source order.
  - Multiline values (e.g. `gridTemplateAreas` template literals) collapse their whitespace, keeping the class name and
    emitted declaration single-line.
  - @pandacss/compiler-shared@2.0.0-beta.5
  - @pandacss/config@2.0.0-beta.5

## 2.0.0-beta.4

### Minor Changes

- 9521059: Add a `--include` flag to the scanning commands (`panda`, `build`, `dev`, `check`, `cssgen`, `debug`, `info`,
  `buildinfo`) to override the config's `include` globs for a single run. The flag is repeatable and accepts
  comma-separated values, and replaces (does not merge with) the configured globs — useful for scanning a subset of
  files in CI or one-off builds.

### Patch Changes

- 74dab7b: `styled-system/types/index` now re-exports `./jsx` for all JSX frameworks, not just React. Solid, Vue,
  Preact, and Qwik generated `types/jsx` but never re-exported it, which could cause "inferred type cannot be named"
  TypeScript errors.
- 0202dba: Fix `globalCss` and token-reference parity with extracted styles.

  - Expand composition props and nested utility transforms in `globalCss`.
  - Resolve token references in raw at-rule conditions.
  - Preserve `token(path, fallback)` fallbacks in emitted CSS variables.

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

- 5316642: Fix slot recipe inference to include slots that appear only in `compoundVariants`. Previously, when `slots`
  was omitted from an `sva` call, a slot used solely inside a compound variant's `css` was dropped and its styles never
  emitted.
- 1378d4a: Complete the SVG asset color-name shortening table (full parity with v1's 55 named colors) and fix a hex
  substring-match bug where values like `#fff000` were incorrectly shortened to `white000`.
- Updated dependencies [23580df]
  - @pandacss/compiler-shared@2.0.0-beta.4
  - @pandacss/config@2.0.0-beta.4

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
