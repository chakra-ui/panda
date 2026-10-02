# @pandacss/bun

## 2.1.1

### Patch Changes

- 24718f4: Fix the Bun and webpack plugins missing styles from source files created while the dev server or watch build
  is running.
- Updated dependencies [576c72a]
- Updated dependencies [a63cb20]
- Updated dependencies [24718f4]
- Updated dependencies [b220f62]
- Updated dependencies [24718f4]
- Updated dependencies [8b6f7e0]
  - @pandacss/compiler@2.1.1
  - @pandacss/transformer@2.1.1
  - @pandacss/compiler-shared@2.1.1

## 2.1.0

### Patch Changes

- 1469790: Warn when styles are nested under a key that isn't a condition or selector, like
  `css({ has: { svg: { color: 'red' } } })`. These styles never applied; the new `nested_property` warning suggests a
  fix, such as `'&:has(svg)'`.
- 1469790: The Vite and Bun plugins no longer print the same warning twice, once when a file is parsed and again when
  the stylesheet is built.
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
  - @pandacss/transformer@2.1.0

## 2.0.1

### Patch Changes

- Updated dependencies [0ad1e26]
- Updated dependencies [f9459ce]
- Updated dependencies [abea127]
  - @pandacss/compiler@2.0.1
  - @pandacss/transformer@2.0.1
  - @pandacss/compiler-shared@2.0.1

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
  - @pandacss/transformer@2.0.0

## 2.0.0-beta.20

### Patch Changes

- Updated dependencies [882730a]
- Updated dependencies [9e45720]
- Updated dependencies [883ecd6]
- Updated dependencies [882730a]
  - @pandacss/compiler@2.0.0-beta.20
  - @pandacss/compiler-shared@2.0.0-beta.20
  - @pandacss/transformer@2.0.0-beta.20

## 2.0.0-beta.19

### Patch Changes

- Updated dependencies [384cfff]
- Updated dependencies [c7f0dae]
- Updated dependencies [f256055]
- Updated dependencies [1f702e2]
- Updated dependencies [5078304]
  - @pandacss/compiler@2.0.0-beta.19
  - @pandacss/compiler-shared@2.0.0-beta.19
  - @pandacss/transformer@2.0.0-beta.19

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
- Updated dependencies [c9dd0f0]
  - @pandacss/compiler@2.0.0-beta.18
  - @pandacss/compiler-shared@2.0.0-beta.18
  - @pandacss/transformer@2.0.0-beta.18

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
  - @pandacss/transformer@2.0.0-beta.17

## 2.0.0-beta.16

### Minor Changes

- badcf7f: Add `@pandacss/bun`, a Bun plugin that codegens, injects CSS into the layer file, and optionally rewrites
  sources with `transform: true`. The default export is a ready-made plugin for `Bun.build` and `bunfig.toml`
  (`[serve.static]`); `pandacss(options)` builds a configured one, and `await register()` from a preload file covers
  `bun run` and `bun test`. In Bun's dev server, edited modules hot-reload together with their new styles.

### Patch Changes

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
  - @pandacss/compiler@2.0.0-beta.16
  - @pandacss/compiler-shared@2.0.0-beta.16
  - @pandacss/transformer@2.0.0-beta.16
