# @pandacss/compiler

## 2.0.0-beta.9

### Minor Changes

- Add `--profile` to any command. It writes `trace.json` and `timings.json` to `.panda/` (or into
  `panda debug --outdir`). Open the trace in `chrome://tracing` or `ui.perfetto.dev`. Replaces v1's `--cpu-prof`.
- Bring back `cssgen:done` as an observe-only hook for final CSS from CLI, Vite, and PostCSS. Use `optimize` or PostCSS
  if you need to mutate CSS.

### Patch Changes

- Add `no-primitive-token` (and inspection metadata) so you can require semantic tokens when a matching category exists.
- Design-system build info loads more reliably when packages are nested, files are stale, or options do not match. You
  get clearer errors for token conflicts and mismatched config.
- Generated `css()` caches repeated inline styles instead of re-serializing every call (~3x faster on dense SSR pages).
- Stop adding `className` to pattern property types. Pattern `*Properties` interfaces only list configured props; JSX
  components keep React's `className`, and pattern functions no longer emit a `class-name_*` utility class.

- Fix runtime class names for multiline string values. Runtime `css()` collapses multiline whitespace the same way
  cssgen does, so selectors match.

- `panda lib` keeps array-form package.json `exports` and warns when it overwrites a subpath you already set.
- `panda lib` omits inferred `files` that package.json `"files"` would not publish, and warns with a `--files` tip for
  dist-only packages.
- Speed up `css()`, style props, and recipe resolution in generated runtimes. Repeated calls with the same flat style
  objects hit the cache about 30–40% faster in SSR benchmarks.

- Memoize multi-arg `css()` calls and shared recipe/pattern resolution in generated runtimes so repeated calls skip
  redundant merge work.

- Speed up generated pattern helpers by memoizing class names for repeated style props.
- Remove the unused `designSystem.resolveChain` API. Chain resolution already happens in the config loader.
- Under `strictTokens`, empty token categories still accept native CSS keywords. `cursor: 'pointer'` works without the
  `[pointer]` escape hatch; same for utilities like `opacity` and `zIndex` with no tokens defined.

- Fix cross-file style extraction on Windows. Resolved paths use forward slashes so aliased and relative `css()` imports
  match; POSIX is unchanged.

## 2.0.0-beta.8

### Patch Changes

- Fix PostCSS HMR style updates.

  Component edits now keep previous atoms available during refresh, and design-system source fallback files refresh
  through the driver instead of waiting for a restart.

## 2.0.0-beta.7

### Patch Changes

- Fix generated token types when a category has no tokens. A config with missing or empty categories no longer collapses
  `TokenValue` to bare `string`, so native CSS value autocomplete (e.g. `currentColor`) stays intact.
- Fix hot module reloading with the PostCSS integration (`@pandacss/dev/postcss`). Editing a component now updates its
  styles live, instead of leaving them stale until you restart the dev server.
  - @pandacss/compiler-shared@2.0.0-beta.7
  - @pandacss/config@2.0.0-beta.7

## 2.0.0-beta.6

### Minor Changes

- Add `panda lib` to package a Panda design system.

  It scans your library source, writes `panda.lib.json`, `panda.buildinfo.json`, and `panda.preset.mjs`, then syncs the
  package exports. It can also run in watch mode.

  Consumers also get token conflict warnings when the app and design system define the same token path; the app value
  wins. If a library's build info is stale, Panda re-extracts its manifest `files` instead of failing the build.

- Adopt a published design system with `designSystem: '@acme/ds'`.

  Panda reads the library's `panda.lib.json`, merges its preset below your config, and reuses its pre-extracted styles.
  If the design system needs a different Panda major version, Panda reports a clear error.

### Patch Changes

- Add `panda analyze` reports. You can write JSON, open a static HTML report, or run the live report UI.
- Add `compiler.designSystem` helpers for `panda.lib.json` manifests.

  The new helpers create, validate, load, and order design-system manifests so consumers can adopt a library through the
  `designSystem` config field.

- Only extract JSX style props when `jsxFramework` is configured.

  This prevents CSS from being generated for JSX components in projects that have not enabled JSX extraction.
  Function-call extraction is unchanged.

- Add a WASI compiler fallback for WebContainer-based environments like StackBlitz.

## 2.0.0-beta.5

### Patch Changes

- Fix v2 CSS-output regressions in `globalCss` and nested style objects:

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

- Add a `--include` flag to the scanning commands (`panda`, `build`, `dev`, `check`, `cssgen`, `debug`, `info`,
  `buildinfo`) to override the config's `include` globs for a single run. The flag is repeatable and accepts
  comma-separated values, and replaces (does not merge with) the configured globs — useful for scanning a subset of
  files in CI or one-off builds.

### Patch Changes

- `styled-system/types/index` now re-exports `./jsx` for all JSX frameworks, not just React. Solid, Vue, Preact, and
  Qwik generated `types/jsx` but never re-exported it, which could cause "inferred type cannot be named" TypeScript
  errors.
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

- Fix slot recipe inference to include slots that appear only in `compoundVariants`. Previously, when `slots` was
  omitted from an `sva` call, a slot used solely inside a compound variant's `css` was dropped and its styles never
  emitted.
- Complete the SVG asset color-name shortening table (full parity with v1's 55 named colors) and fix a hex
  substring-match bug where values like `#fff000` were incorrectly shortened to `white000`.

## 2.0.0-beta.3

### Patch Changes

- Improve generated style prop types for native CSS values and Panda utilities.

  Utility shorthands like `bg`, `bgColor`, and `color` now accept the matching native CSS values when `strictTokens` is
  off. Keyframe steps also use the same style object types as global CSS.

- Trim surrounding whitespace before generating class names, so cssgen and runtime `css()` produce the same class for
  values like `'0 auto '`.
- Fix several nested arbitrary selector edge cases.

  - Keep `&` intact inside quoted attribute selector values, like `[data-category="sound & vision"]`.
  - Keep parent selectors like `&:last-child` attached to the parent when followed by a nested descendant such as
    `& .divider`.
  - Scope comma selector members without `&` as descendants.
  - Wrap combinator parents in `:is()` when a nested selector contains multiple `&` tokens.

- Fix generated types for recipes with no variants.

  Variant-less recipes no longer add a broad string index signature, so `defaultProps` and `createSlotRecipeContext`
  providers accept valid non-variant props again.

- Improve parse handling during extraction.

  - `.astro` frontmatter with a top-level `return` now extracts correctly.
  - Files Panda can't fully parse now warn instead of aborting the build. The warning explains that some styles may be
    missing. Use `--max-warnings 0` if you want parse warnings to fail CI.
  - @pandacss/compiler-shared@2.0.0-beta.3
  - @pandacss/config@2.0.0-beta.3

## 2.0.0-beta.2

### Minor Changes

- Skip rewriting generated files when the content is unchanged, so watch mode no longer bumps mtimes and triggers extra
  reloads/rebuilds for no-op codegen and CSS writes.

  The compiler write APIs now use object params consistently:

  - `writeArtifacts({ outdir, cwd, forceImportExtension, artifacts })`
  - `writeCss({ outfile, cwd, emitLayerDeclaration })`
  - `writeSplitCss({ outdir, cwd })`

### Patch Changes

- Fix cssgen dropping the leading dash on vendor-prefixed property names, so the class (and the CSS property) never
  matched the runtime.

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

- Fix object-map utility values generating CSS selectors that do not match runtime class names.

  Authored literal values now keep their literal class segment, e.g. `minHeight: '100vh'` emits `.min-h_100vh` instead
  of reverse-mapping to `.min-h_screen`.

- Fix the runtime `css()` naming `!important` classes differently from cssgen, so the rule never matched.

  `css({ padding: '0 !important' })` put `p_0_!important` on the element — the runtime hashed the whole string
  (`withoutSpace('0 !important')`) — but cssgen wrote `.p_0\!` (it strips `!important` and marks the class with a
  trailing `!`). The two never matched, so the `!important` declaration silently never applied. Same for
  `zIndex: '1002 !important'`, `whiteSpace: 'nowrap !important'`, `color: 'red.500 !important'`, etc.

  The generated runtime now mirrors legacy Panda (and the native emitter): it detects `!important`, strips it before
  hashing the value, and appends a trailing `!` to the final class — `p_0!`, `z_1002!`, `c_red.500!` — exactly the class
  cssgen emits (`.p_0\!`). Adds `isImportant` / `withoutImportant` runtime helpers (matching `@pandacss/shared`'s
  `/\s*!(important)?/i`) and wires them into `createCssRuntime`'s `serializeCss`, so both `css({})` and `css\`\`` are
  fixed in one place.

## 2.0.0-beta.0

### Minor Changes

- Emit native token CSS in the Rust stylesheet compiler and align the default `cssVarRoot` with JS output
  (`:where(:root, :host)`).

### Patch Changes

- Improve compiled JSX extraction so `css` props are recognized from framework runtime helper output, including React,
  Preact, Vue, Solid, and Qwik builds.
- Merge adjacent selectors that share an identical declaration block into one comma-joined rule (parity with the legacy
  engine's merge-rules pass).

  The v2 native emitter now coalesces consecutive rules with the same declaration block — e.g.
  `css({ _hover: { color: 'red' } })` + `css({ '[data-x] &': { color: 'red' } })` emits one
  `.hover\:color_red:hover, [data-x] .…:color_red { color: red }` instead of two separate rules. The merge is
  adjacency-only (cascade-safe, mirroring lightningcss's `CssRuleList::minify`) and runs at the IR level — no CSS
  parser, no new dependency, identical in the native and wasm builds. It covers the atomic and globalCss layers. CSS is
  functionally equivalent, just smaller.

- Sort container queries by their resolved `inline-size`, like media queries.

  The cascade sorter only recognized `width`-based queries, so theme container conditions (which emit
  `@container (inline-size >= …)`) fell back to raw-string ordering — e.g. `inline-size >= 16rem` sorted before
  `inline-size >= 8rem`, inverting the mobile-first cascade. The query parser now resolves direction + length across
  every size axis (`width`, `inline-size`, `height`, `block-size`), in both modern (`>=`/`<`) and legacy
  (`min-*`/`max-*`) forms, so container breakpoints sort by magnitude.

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
