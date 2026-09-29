---
'@pandacss/bun': major
'@pandacss/cli': major
'@pandacss/compiler': major
'@pandacss/compiler-shared': major
'@pandacss/compiler-wasm': major
'@pandacss/config': major
'@pandacss/dev': major
'@pandacss/eslint-plugin': major
'@pandacss/language-server': major
'@pandacss/mcp': major
'@pandacss/postcss': major
'@pandacss/preset-base': major
'@pandacss/preset-panda': major
'@pandacss/preset-typography': major
'@pandacss/rollup': major
'@pandacss/transformer': major
'@pandacss/types': major
'@pandacss/typescript-plugin': major
'@pandacss/vite': major
'@pandacss/webpack': major
---

Panda 2.0 replaces the compiler with a Rust engine built on [Oxc](https://oxc.rs). You write the same `css()`, recipes,
patterns, tokens, and JSX props.

#### Improvements

- [New Rust engine](https://panda-css.com/blog/panda-css-v2#inside-the-new-engine): one parse per file, cross-file value
  resolution, and native CSS output. No more `ts-morph` or PostCSS in the build.
- [Much faster builds](https://panda-css.com/blog/panda-css-v2#how-much-faster-is-panda-20): extraction is 15–37×
  faster, watch mode ~360×, and `staticCss` ~85×.
- [Lighter generated types](https://panda-css.com/blog/panda-css-v2#generated-types-are-lighter): ~99% fewer TypeScript
  type instantiations, so your editor and CI do less work.
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
- [New utilities](https://panda-css.com/blog/panda-css-v2#new-base-preset-utilities): masks, scrollbars, and pointer and
  validity conditions.
- [Variables via `@property`](https://panda-css.com/blog/panda-css-v2#variables-via-property): no more 34-variable reset
  on every element.
- [A rebuilt CLI](https://panda-css.com/blog/panda-css-v2#a-better-cli): `panda` runs codegen and CSS together, and
  `panda doctor`, `panda analyze`, `panda debug`, and `--profile` help you inspect a project.
- [ESLint and oxlint plugin](https://panda-css.com/blog/panda-css-v2#eslint-plugin): lints against the same extraction
  your build uses.
- [Typography preset](https://panda-css.com/blog/panda-css-v2#a-typography-preset): `@pandacss/preset-typography` adds a
  `prose` recipe for Markdown and CMS content.

Panda 2.0 is ESM-only and needs Node 22 or newer. To move an existing project, follow the
[upgrade guide](https://panda-css.com/docs/get-started/upgrading-to-v2). For the full story,
[read the announcement post](https://panda-css.com/blog/panda-css-v2).
