# @pandacss/preset-panda

## 2.1.1

### Patch Changes

- @pandacss/types@2.1.1

## 2.1.0

### Patch Changes

- @pandacss/types@2.1.0

## 2.0.1

### Patch Changes

- @pandacss/types@2.0.1

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
  - @pandacss/types@2.0.0

## 2.0.0-beta.20

### Patch Changes

- Updated dependencies [9e45720]
  - @pandacss/types@2.0.0-beta.20

## 2.0.0-beta.19

### Patch Changes

- @pandacss/types@2.0.0-beta.19

## 2.0.0-beta.18

### Patch Changes

- @pandacss/types@2.0.0-beta.18

## 2.0.0-beta.17

### Patch Changes

- Updated dependencies [5b9a056]
- Updated dependencies [1ca20ab]
  - @pandacss/types@2.0.0-beta.17

## 2.0.0-beta.16

### Patch Changes

- Updated dependencies [dea1ef5]
- Updated dependencies [c58d45d]
- Updated dependencies [ef14fc5]
  - @pandacss/types@2.0.0-beta.16

## 2.0.0-beta.15

### Patch Changes

- Updated dependencies [ec65db3]
- Updated dependencies [02bd0ad]
- Updated dependencies [e18eeb3]
- Updated dependencies [2d5d152]
  - @pandacss/types@2.0.0-beta.15

## 2.0.0-beta.14

### Patch Changes

- @pandacss/types@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- @pandacss/types@2.0.0-beta.13

## 2.0.0-beta.12

### Patch Changes

- @pandacss/types@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- @pandacss/types@2.0.0-beta.11

## 2.0.0-beta.10

### Patch Changes

- Updated dependencies [52e84e6]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/types@2.0.0-beta.10

## 1.x and earlier

See the [v1 changelog](https://github.com/chakra-ui/panda/blob/v1/packages/preset-panda/CHANGELOG.md).
