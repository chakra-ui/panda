# @pandacss/compiler

## 2.0.0-beta.14

### Patch Changes

- 10014b4: Fix a `designSystem` consumer emitting the wrong CSS property for a library utility with a JS `transform`. A
  `boxSize` prop emitted `box-size` instead of `width`/`height`, because styles replayed from the library's build info
  skipped the transform.
- a4f3944: Warn when a `designSystem` consumer replays a library atom whose utility isn't registered in its own config,
  usually because the library's preset wasn't merged. The style used to emit silently as the kebab-cased utility name
  (`boxSize` became `box-size`). Now `panda cssgen`/`codegen` reports it, naming the design system and the utility, so
  you can add the missing preset.
- 9bcdcb0: Fix `outExtension: "mjs"` emitting `.d.mts` files that TypeScript's bundler resolver cannot find.

  Clean codegen now writes `.d.ts` next to `.mjs`, so `import { css } from 'styled-system/css'` typechecks. Set
  `forceImportExtension: true` if you still want `.d.mts`.

- ef7ffc7: Fix the `{colors.x/alpha}` opacity modifier being ignored outside the `colors` category. In `shadows`,
  `borders` and `gradients` it passed through as raw `colors.x/alpha` text, which browsers drop. It now expands to
  `color-mix(...)` everywhere.

  Fix the composite object form of a `semanticTokens` value emitting nothing. It was parsed as a conditions map named
  after its own keys. Applies to composite `shadow`, `border` and `asset` values.

  ```ts
  semanticTokens: {
    shadows: {
      card: { value: { offsetX: '0', offsetY: '2px', blur: '4px', spread: '0', color: '{colors.ink}' } },
    },
  }
  ```

  Fix composite `gradients` emitting bare numbers where CSS needs a unit. A stop `position` now serializes as a
  percentage (`100%`, was `100px`) and a numeric `placement` as an angle (`45deg`, was `45`, which browsers rejected
  outright). Gradients using either form will render differently.

- 6bcc885: Speed up `staticCss` builds that use breakpoint or container conditions. Condition queries are resolved once
  per theme instead of rebuilt for every rule, so a config on `preset-panda`'s container scale drops from ~14s to ~0.3s
  (roughly 50x faster, a 98% cut) with identical CSS output. The saving grows with the scale: a 64-size container scale
  goes from 52.6s to 38ms.
  - @pandacss/compiler-shared@2.0.0-beta.14
  - @pandacss/config@2.0.0-beta.14
  - @pandacss/types@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- b621edb: Fix `animationName` rejecting every keyframe name under `strictTokens`. Generated types now inline the
  keyframe names (`KeyframesValue = "spin" | "fadeIn" | …`) instead of pointing at a `keyframes` token category that
  never existed, so `css({ animationName: 'spin' })` type-checks without the `[spin]` escape hatch.
  - @pandacss/compiler-shared@2.0.0-beta.13
  - @pandacss/config@2.0.0-beta.13
  - @pandacss/types@2.0.0-beta.13

## 2.0.0-beta.12

### Minor Changes

- 8ccb118: Fix `objectPosition`, `backgroundPosition` and the other position properties rejecting valid values like
  `center` under `strictTokens`. `system.d.ts` declared `PositionValue`, `ContainerValue` and `ZIndexValue` twice, so
  TypeScript bound the wrong one and reported `Duplicate identifier` under `skipLibCheck: false`.

  Panda's built-in CSS value types are renamed with a `Css` prefix, so the `{Property}Value` aliases generated from your
  utilities can no longer shadow them:

  ```ts
  // before
  import type { PositionValue, LengthValue, Globals } from './styled-system/types'

  // after
  import type { CssPosition, CssLength, CssGlobals } from './styled-system/types'
  ```

### Patch Changes

- 172c52f: Accept styles nested more than one array deep in `css()` and `css.raw()`. The runtime already flattened them;
  the type stopped at a single level, so a wrapper chain three or more levels deep failed to typecheck.
- 98aaa76: Fix arbitrary values containing a quote or backslash producing unparseable output when merged with a dynamic
  `className`. `<Box className={cls} color={'[var(--x, "red")]'} />` emitted a broken string literal instead of escaping
  the class name.
- ceb8d8d: Emit a class shared by every branch once instead of repeating it in each one.

  ```ts
  // before
  export const cls = (wide ? 'd_flex p_8' : 'd_flex p_4') + ' ' + (tall ? 'd_flex m_2' : 'd_flex m_1')
  // after
  export const cls = 'd_flex' + ' ' + (wide ? 'p_8' : 'p_4') + ' ' + (tall ? 'm_2' : 'm_1')
  ```

- 28ee00a: Precompute the static styles of a `styled.*` element that also spreads unknown props. The factory and the
  spread stay so runtime style props still work; everything Panda can see at build time collapses into one `className`.
- 604b103: Fix conditional spreads dropping static styles they don't override.
  `css({ padding: '2', margin: '3', ...(b ? { padding: '1' } : { margin: '4' }) })` lost `margin: '3'` and
  `padding: '2'` from their respective branches instead of keeping them.
- 25137db: Speed up `css()` when styles arrive through a wrapper chain. Each level rebuilds its array of styles every
  render, so the memo used to re-serialize the whole tree on every call. It now keys those calls on the identity of the
  style objects inside, which don't change.

  ```tsx
  const L1 = ({ css: cssProp }) => <L0 css={[l1, cssProp]} />
  ```

  Renders roughly 4x faster for a three-level chain, 3x for six levels. Plain `css({ … })` calls are unaffected.

- c2fcd98: Fix `@pandacss/compiler/tooling` failing to load the native binding, which broke the ESLint/oxlint plugin
  with `Native project does not support pattern.transform callbacks` on any config using preset patterns. The binding is
  now resolved from the package root instead of relative to the emitted module, and a binding that genuinely fails to
  load now says so.
- fad2f12: Fix `.raw()` handing back a class string instead of a style object, which broke anything composing those
  styles.

  ```ts
  const button = cva({ base: { color: 'red' } })

  const styles = button.raw() // was "color_red", now { color: 'red' }

  css(styles, { color: 'blue' }) // merges, instead of dropping the base
  ```

  Covers `css.raw()`, `recipe.raw()`, `pattern.raw()` and inline `cva`/`sva`. When an imported recipe's variants aren't
  known at build time, Panda now warns instead of returning a string.

- 736358d: Fix `.raw()` on an imported recipe being left alone in files that import nothing else from Panda.

  ```ts
  import { button } from './recipes' // the only import

  const styles = button.raw() // was a class string, now { color: 'red' }
  ```

- 28ee00a: Fold same-file `styled()` chains to their underlying element when the class string is constant, so `<Button>`
  no longer pays for a `forwardRef` component level at runtime. Chains with variants, an options argument, or a
  non-local base keep the existing runtime behaviour.
  - @pandacss/compiler-shared@2.0.0-beta.12
  - @pandacss/config@2.0.0-beta.12
  - @pandacss/types@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- c7f949a: Fix `pos` and other shorthands for value-less native properties (like `position`) missing from the generated
  types. Use them as style props, in `css()`, and on pattern components.
  - @pandacss/compiler-shared@2.0.0-beta.11
  - @pandacss/config@2.0.0-beta.11
  - @pandacss/types@2.0.0-beta.11

## 2.0.0-beta.10

### Minor Changes

- 05e085d: With a single-level `designSystem`, `panda codegen` reuses the library's styled-system instead of copying it.
  Your app only generates the delta (extra tokens, recipes, patterns). Missing library exports fail with
  `design_system_export_missing` instead of a silent bundler error.

  ```ts
  export default defineConfig({
    designSystem: '@acme/ds',
  })
  ```

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

- 05e085d: Fix `panda lib` / `panda buildinfo` writing `panda: "*"` when the design system has no `@pandacss/dev` peer.
  That range couldn't hydrate (`manifest requires Panda *`). Both commands now fall back to the running Panda major (for
  example `^2.0.0`). Pass `--panda` to set the range yourself.
- 05e085d: Stop `panda lib` from writing unpublishable peer ranges into `panda.lib.json`. A `catalog:` or `workspace:*`
  `@pandacss/dev` range now falls back to the running Panda's major instead of being stamped verbatim. Pass
  `--panda <range>` to set one explicitly.
- 05e085d: `panda lib` publishes machine artifacts under `./panda/*`, with manifest `files` paths relative to the lib
  outdir. Recipe/pattern runtime overlays only kick in when the design system owns that category.
- 5c060e7: Apply custom utility `transform` functions everywhere styles are authored.

  Custom-utility transforms (and their shorthands) now run inside `cva`/`sva`, `styled` recipes, `globalCss`, and
  composition styles (`textStyles`/`layerStyles`/`animationStyles`) — including conditional values — matching `css()`
  and config recipes. This fixes preset-base's `shadowColor`/`textShadowColor` and any user utility that maps a value to
  a custom property.

- Updated dependencies [05e085d]
- Updated dependencies [05e085d]
- Updated dependencies [f8027f3]
- Updated dependencies [ebe9f5b]
- Updated dependencies [05e085d]
- Updated dependencies [52e84e6]
- Updated dependencies [05e085d]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/compiler-shared@2.0.0-beta.10
  - @pandacss/config@2.0.0-beta.10
  - @pandacss/types@2.0.0-beta.10

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
