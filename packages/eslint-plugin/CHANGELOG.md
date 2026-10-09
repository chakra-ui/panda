# @pandacss/eslint-plugin

## 2.2.0

### Patch Changes

- 9d5077d: Fix `prefer-token` reporting negative spacing tokens (`marginTop: '-2'`) and color opacity modifiers
  (`red.500/40`) as hardcoded values. `resolveUtilityValue()` now returns the `tokens` a value references.
- Updated dependencies [0a95d5d]
- Updated dependencies [e9d19e3]
- Updated dependencies [e71a5ed]
- Updated dependencies [4bc239a]
- Updated dependencies [e899f53]
- Updated dependencies [9d5077d]
- Updated dependencies [d5fb171]
- Updated dependencies [da7c333]
- Updated dependencies [1744ddd]
  - @pandacss/compiler@2.2.0
  - @pandacss/config@2.2.0
  - @pandacss/compiler-shared@2.2.0

## 2.1.2

### Patch Changes

- Updated dependencies [7f36e78]
- Updated dependencies [d941e4a]
- Updated dependencies [69ccc9f]
- Updated dependencies [b8e2b5b]
- Updated dependencies [db5d9b7]
- Updated dependencies [30465d3]
- Updated dependencies [d8c494c]
- Updated dependencies [e3fd924]
- Updated dependencies [b806435]
- Updated dependencies [645d370]
- Updated dependencies [ddc34f9]
- Updated dependencies [4842f3c]
- Updated dependencies [145f6d2]
- Updated dependencies [85fb637]
- Updated dependencies [164508e]
- Updated dependencies [43cfcc1]
- Updated dependencies [42ff936]
- Updated dependencies [b8e2b5b]
- Updated dependencies [802eb61]
- Updated dependencies [3f41f62]
- Updated dependencies [a1c495c]
- Updated dependencies [22ba83d]
- Updated dependencies [f33fb6c]
  - @pandacss/compiler@2.1.2
  - @pandacss/config@2.1.2
  - @pandacss/compiler-shared@2.1.2

## 2.1.1

### Patch Changes

- Updated dependencies [576c72a]
- Updated dependencies [a63cb20]
- Updated dependencies [24718f4]
- Updated dependencies [b220f62]
- Updated dependencies [24718f4]
- Updated dependencies [8b6f7e0]
  - @pandacss/compiler@2.1.1
  - @pandacss/compiler-shared@2.1.1
  - @pandacss/config@2.1.1

## 2.1.0

### Patch Changes

- ee5c50b: Fix `prefer-token` false positives for token-valued ternaries and utilities such as `flex`. Report unknown
  condition warnings through `extraction-diagnostics` in ESLint and Oxlint.
- Updated dependencies [5da09d9]
- Updated dependencies [ee5c50b]
- Updated dependencies [ba062cd]
- Updated dependencies [ea34d1e]
- Updated dependencies [cd08564]
- Updated dependencies [76c5e6a]
- Updated dependencies [bd891e8]
- Updated dependencies [1469790]
- Updated dependencies [1469790]
- Updated dependencies [702ee2a]
- Updated dependencies [4a781a0]
- Updated dependencies [e5a80ea]
- Updated dependencies [916c77c]
- Updated dependencies [a37c416]
- Updated dependencies [b44b8e2]
- Updated dependencies [f4e1418]
- Updated dependencies [b198b21]
- Updated dependencies [0acc0dc]
  - @pandacss/compiler@2.1.0
  - @pandacss/compiler-shared@2.1.0
  - @pandacss/config@2.1.0

## 2.0.1

### Patch Changes

- Updated dependencies [0ad1e26]
- Updated dependencies [f9459ce]
  - @pandacss/compiler@2.0.1
  - @pandacss/compiler-shared@2.0.1
  - @pandacss/config@2.0.1

## 2.0.0

### Major Changes

- bb3d117: Panda 2.0 replaces the compiler with a Rust engine built on [Oxc](https://oxc.rs). You write the same
  `css()`, recipes, patterns, tokens, and JSX props.

  #### Improvements

  - [New Rust engine](https://panda-css.com/blog/panda-css-v2#inside-the-new-engine): one parse per file, cross-file
    value resolution, and native CSS output. No more `ts-morph` or PostCSS in the build.
  - [Much faster builds](https://panda-css.com/blog/panda-css-v2#how-much-faster-is-panda-20): extraction is 15–37×
    faster, watch mode ~360×, and `staticCss` ~85×.
  - [Lighter generated types](https://panda-css.com/blog/panda-css-v2#generated-types-are-lighter): ~99% fewer
    TypeScript type instantiations, so your editor and CI do less work.
  - [Faster runtime](https://panda-css.com/blog/panda-css-v2#runtime-is-4-faster): `css()` and recipes memoize repeated
    styles, up to ~4× faster.
  - [One engine for Node and the browser](https://panda-css.com/blog/panda-css-v2#one-engine-for-node-and-browser):
    `@pandacss/compiler-wasm` runs the same engine in the browser and produces the same CSS.
  - [Bundler plugins](https://panda-css.com/docs/styling/source-transforms#enabling-it): `@pandacss/vite`,
    `@pandacss/webpack`, `@pandacss/rollup`, and `@pandacss/bun` run Panda inside your build.
  - [Source transforms](https://panda-css.com/docs/styling/source-transforms): with `transform: true`, the bundler
    rewrites static `css()`, recipe, pattern, and `styled()` calls to class strings, so the styling runtime drops out of
    your bundle.
  - [Smaller CSS with `optimize`](https://panda-css.com/docs/styling/optimization): opt in to removing unused tokens and
    keyframes, emitting only the compound variants you use, and tree-shaking design systems.

  #### New features

  - [Publishable design systems](https://panda-css.com/blog/panda-css-v2#publishable-design-systems): author with
    `panda lib`, consume with `designSystem`, with no re-extraction in the app.
  - [View transitions](https://panda-css.com/blog/panda-css-v2#view-transitions): `viewTransition()` styles the View
    Transitions API and gives you a stable class.
  - [Value fallbacks, local keyframes, and anchor fallbacks](https://panda-css.com/blog/panda-css-v2#ordered-value-fallbacks):
    `firstThatWorks()`, `keyframes()`, and `positionTry()`, tree-shaken to what you use.
  - [New utilities](https://panda-css.com/blog/panda-css-v2#new-base-preset-utilities): masks, scrollbars, and pointer
    and validity conditions.
  - [Variables via `@property`](https://panda-css.com/blog/panda-css-v2#variables-via-property): no more 34-variable
    reset on every element.
  - [A rebuilt CLI](https://panda-css.com/blog/panda-css-v2#a-better-cli): `panda` runs codegen and CSS together, and
    `panda doctor`, `panda analyze`, `panda debug`, and `--profile` help you inspect a project.
  - [ESLint and oxlint plugin](https://panda-css.com/blog/panda-css-v2#eslint-plugin): lints against the same extraction
    your build uses.
  - [Typography preset](https://panda-css.com/blog/panda-css-v2#a-typography-preset): `@pandacss/preset-typography` adds
    a `prose` recipe for Markdown and CMS content.

  Panda 2.0 is ESM-only and needs Node 22 or newer. To move an existing project, follow the
  [upgrade guide](https://panda-css.com/docs/get-started/upgrading-to-v2). For the full story,
  [read the announcement post](https://panda-css.com/blog/panda-css-v2).

### Patch Changes

- Updated dependencies [bb3d117]
  - @pandacss/compiler@2.0.0
  - @pandacss/compiler-shared@2.0.0
  - @pandacss/config@2.0.0

## 2.0.0-beta.20

### Patch Changes

- Updated dependencies [882730a]
- Updated dependencies [9e45720]
- Updated dependencies [883ecd6]
- Updated dependencies [882730a]
  - @pandacss/compiler@2.0.0-beta.20
  - @pandacss/compiler-shared@2.0.0-beta.20
  - @pandacss/config@2.0.0-beta.20

## 2.0.0-beta.19

### Patch Changes

- Updated dependencies [384cfff]
- Updated dependencies [c7f0dae]
- Updated dependencies [f256055]
- Updated dependencies [1f702e2]
- Updated dependencies [5078304]
  - @pandacss/compiler@2.0.0-beta.19
  - @pandacss/compiler-shared@2.0.0-beta.19
  - @pandacss/config@2.0.0-beta.19

## 2.0.0-beta.18

### Patch Changes

- Updated dependencies [c9dd0f0]
- Updated dependencies [7e328bd]
- Updated dependencies [c9dd0f0]
- Updated dependencies [c5c4e2b]
- Updated dependencies [006e5c0]
- Updated dependencies [048c70c]
- Updated dependencies [4db4f75]
- Updated dependencies [8bbb6bb]
- Updated dependencies [c014979]
- Updated dependencies [c09573a]
- Updated dependencies [c9dd0f0]
  - @pandacss/compiler@2.0.0-beta.18
  - @pandacss/compiler-shared@2.0.0-beta.18
  - @pandacss/config@2.0.0-beta.18

## 2.0.0-beta.17

### Patch Changes

- Updated dependencies [597d2cb]
- Updated dependencies [597d2cb]
- Updated dependencies [5b9a056]
- Updated dependencies [8d29caa]
- Updated dependencies [323af68]
- Updated dependencies [55cab2b]
- Updated dependencies [bb47c38]
- Updated dependencies [774529f]
- Updated dependencies [e82613b]
  - @pandacss/compiler-shared@2.0.0-beta.17
  - @pandacss/compiler@2.0.0-beta.17
  - @pandacss/config@2.0.0-beta.17

## 2.0.0-beta.16

### Minor Changes

- 3751b7b: Add an opt-in `no-descendant-selectors` rule that flags selectors styling other elements (`& > li`,
  `.foo &`), keeping every style scoped to its own element. Cross-element state stays available through conditions like
  `_groupHover`.

### Patch Changes

- Updated dependencies [a5bab14]
- Updated dependencies [f583fb9]
- Updated dependencies [6b04d94]
- Updated dependencies [dfb17b2]
- Updated dependencies [84720fc]
- Updated dependencies [d94d26c]
- Updated dependencies [c3702af]
- Updated dependencies [dea1ef5]
- Updated dependencies [a46ecb4]
- Updated dependencies [ca9bb58]
- Updated dependencies [c58d45d]
- Updated dependencies [446210a]
- Updated dependencies [9bdafba]
- Updated dependencies [f583fb9]
- Updated dependencies [b2294ca]
- Updated dependencies [af261f5]
- Updated dependencies [9da80e1]
- Updated dependencies [ef14fc5]
- Updated dependencies [064e58f]
- Updated dependencies [ef68d33]
- Updated dependencies [bcbcb22]
  - @pandacss/config@2.0.0-beta.16
  - @pandacss/compiler@2.0.0-beta.16
  - @pandacss/compiler-shared@2.0.0-beta.16

## 2.0.0-beta.15

### Patch Changes

- Updated dependencies [8b43347]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [7c8a215]
- Updated dependencies [8885864]
- Updated dependencies [e18eeb3]
- Updated dependencies [2d5d152]
  - @pandacss/compiler@2.0.0-beta.15
  - @pandacss/compiler-shared@2.0.0-beta.15
  - @pandacss/config@2.0.0-beta.15

## 2.0.0-beta.14

### Patch Changes

- Updated dependencies [10014b4]
- Updated dependencies [a4f3944]
- Updated dependencies [9bcdcb0]
- Updated dependencies [ef7ffc7]
- Updated dependencies [6bcc885]
  - @pandacss/compiler@2.0.0-beta.14
  - @pandacss/compiler-shared@2.0.0-beta.14
  - @pandacss/config@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- Updated dependencies [b621edb]
  - @pandacss/compiler@2.0.0-beta.13
  - @pandacss/compiler-shared@2.0.0-beta.13
  - @pandacss/config@2.0.0-beta.13

## 2.0.0-beta.12

### Patch Changes

- Updated dependencies [172c52f]
- Updated dependencies [98aaa76]
- Updated dependencies [ceb8d8d]
- Updated dependencies [28ee00a]
- Updated dependencies [604b103]
- Updated dependencies [25137db]
- Updated dependencies [c2fcd98]
- Updated dependencies [8ccb118]
- Updated dependencies [fad2f12]
- Updated dependencies [736358d]
- Updated dependencies [28ee00a]
  - @pandacss/compiler@2.0.0-beta.12
  - @pandacss/compiler-shared@2.0.0-beta.12
  - @pandacss/config@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- Updated dependencies [c7f949a]
  - @pandacss/compiler@2.0.0-beta.11
  - @pandacss/compiler-shared@2.0.0-beta.11
  - @pandacss/config@2.0.0-beta.11

## 2.0.0-beta.10

### Patch Changes

- Updated dependencies [05e085d]
- Updated dependencies [05e085d]
- Updated dependencies [d2bea8a]
- Updated dependencies [f8027f3]
- Updated dependencies [ebe9f5b]
- Updated dependencies [05e085d]
- Updated dependencies [52e84e6]
- Updated dependencies [05e085d]
- Updated dependencies [5c060e7]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/compiler-shared@2.0.0-beta.10
  - @pandacss/compiler@2.0.0-beta.10
  - @pandacss/config@2.0.0-beta.10

## 2.0.0-beta.9

### Patch Changes

- Add `no-primitive-token` (and inspection metadata) so you can require semantic tokens when a matching category exists.

## 2.0.0-beta.4

### Patch Changes

- Add the ESLint plugin core (settings, project caching, inspection caching, source range lookup), the first Panda lint
  rules (`extraction-diagnostics`, `file-not-included`, `no-invalid-token-paths`, `no-debug`, a consolidated
  `no-deprecated` covering deprecated tokens, utilities, recipes, and patterns — with the author's deprecation message
  and a `kinds` option, and `prefer-token`, which flags raw values where a token exists and tells you the token to use
  (semantic tokens preferred, value forms normalized) across every style-writing form — `css()`, style props, responsive
  arrays, per-prop conditions, and `cva`/`sva`/`styled` recipe styles — with a per-leaf quick-fix; `recommended` scopes
  it to colors, replacing v1's `no-hardcoded-color`; plus `no-shorthand-longhand-mix`, which flags a shorthand mixed
  with one of its own longhands in the same block (`margin` + `marginLeft`) since the longhand wins regardless of source
  order; and `consistent-property-style`, an autofixable rule enforcing either Panda shorthand aliases (`ml`) or
  longhand canonical names (`marginLeft`) via `style: 'shorthand' | 'longhand'`; and `no-invalid-nesting` (recommended),
  which flags a nested selector missing `&` — e.g. `':hover'` instead of `'&:hover'` — that Panda silently ignores, and
  suggests the `&` prefix), and a `configs.recommended({ configPath })` flat-config entry with `@pandacss/*` rule ids.
  Config and compiler loading is preloaded once per project so rule visitors stay synchronous.

  The same rules also run under oxlint via the `@pandacss/eslint-plugin/oxlint` entry (oxlint's ESLint-compatible JS
  plugins).
