# @pandacss/types

## 2.2.0

No changes in this release.

## 2.1.2

No changes in this release.

## 2.1.1

## 2.1.0

## 2.0.1

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

## 2.0.0-beta.20

### Major Changes

- 9e45720: Remove Qwik JSX support:

  - `jsxFramework: 'qwik'` no longer generates `styled`, `Box`, or pattern components.
  - To migrate, remove `jsxFramework` and style Qwik components with `css()`, `cva()`, and pattern functions on the
    `class` attribute.

## 2.0.0-beta.19

## 2.0.0-beta.18

## 2.0.0-beta.17

### Major Changes

- 1ca20ab: Remove `defineParts` and the `Parts` / `Part` types. Write the part selectors directly in your recipe, or use
  `defineSlotRecipe` for a class per part.

  If you still want the helper, it's a few lines you can keep in your own config:

  ```ts
  const defineParts =
    <T extends Record<string, { selector: string }>>(parts: T) =>
    (config: Partial<Record<keyof T, SystemStyleObject>>): SystemStyleObject =>
      Object.fromEntries(Object.entries(config).map(([key, value]) => [parts[key].selector, value]))
  ```

### Minor Changes

- 5b9a056: Add `firstThatWorks()` for ordered CSS value fallbacks, so one property can carry a modern value and a
  supported one:

  ```ts
  import { css, firstThatWorks } from 'styled-system/css'

  css({ color: firstThatWorks('oklch(55% 0.18 250)', '#0057b8') })
  ```

  ```css
  .c_firstThatWorks\(oklch\(55\%_0\.18_250\)\,_\#0057b8\) {
    color: #0057b8;
    color: oklch(55% 0.18 250);
  }
  ```

  Write the value you want first, as in StyleX. Members are typed by the property they sit in, so they autocomplete and
  `strictTokens` still applies. Config recipes import `firstThatWorks` from `@pandacss/dev`, or write the
  `firstThatWorks(a, b)` value form directly.

## 2.0.0-beta.16

### Major Changes

- ef14fc5: Remove the `syntax` config option and the `template-literal` authoring mode. Drop `syntax` from your config
  and the `--syntax` flag from `panda init`, and write styles with the object syntax: `css({ color: 'red' })` instead of
  `` css`color: red` ``.

### Minor Changes

- dea1ef5: Add a `keyframes()` factory to `styled-system/css` for inline, component-local animations.

  `keyframes({ from: {...}, to: {...} })` returns a `kf_…` animation name and emits its `@keyframes` block, tree-shaken
  to what a build actually references through `animationName` or the `animation` shorthand. Object form only — a bare
  `animationName: 'spin'` already resolves a `theme.keyframes` entry, so there is no named form. Shared, design-system
  animations still belong in `theme.keyframes`.

- c58d45d: Add a `positionTry()` factory to `styled-system/css` and a `theme.positionTry` key for named CSS
  anchor-positioning fallbacks, and remove `globalPositionTry`.

  `positionTry('bottom')` or `positionTry({ top: 'anchor(bottom)' })` returns the dashed-ident for
  `positionTryFallbacks` and emits the `@position-try` block, tree-shaken to what a build uses. Move `globalPositionTry`
  entries to `theme.positionTry` and reference them through the factory. A block that must emit unconditionally with a
  hand-authored name belongs in a plain `.css` file.

## 2.0.0-beta.15

### Minor Changes

- 02bd0ad: Add `optimize.propertyFallback`, which also seeds each emitted `@property` registration as a plain
  declaration so engines that ignore `@property` (Safari below 16.4, Firefox below 128) still get the defaults.

  ```ts
  export default defineConfig({
    optimize: { propertyFallback: true },
  })
  ```

  Off by default. Seeds come from the registrations that survived pruning, so you only pay for the variables you use.

- e18eeb3: Add `theme.viewTransitions` so a preset can name shared view-transition bags. Call `viewTransition('slide')`
  and Panda inlines `"vt_slide"`. Unused names stay out of the CSS.
- 2d5d152: Add `globalVars` to utility definitions, so a variable's `@property` registration lives next to the utility
  that writes it. Registrations merge into the config-level `globalVars` and are pruned when unused.

  ```ts
  utilities: {
    blur: {
      className: 'blur',
      globalVars: { '--blur': { syntax: '*', inherits: false } },
      transform: (value) => ({ '--blur': `blur(${value})` }),
    },
  }
  ```

  Putting a plain value on a name a utility registered warns during CSS emit, but only when your stylesheet actually
  reads that variable, since the value drops the registration and starts the variable inheriting. Pass a full
  `@property` object to retune one instead. Two utilities registering the same name with different definitions is a
  config error.

### Patch Changes

- ec65db3: Add `maskBottomFrom`, `maskXFrom`, and `maskRadialFrom` so you can fade an edge or spotlight an image without
  writing `mask-image` gradients by hand. Raw `maskImage` still works as an escape hatch.

  ```ts
  css({ overflow: 'auto', maskBottomFrom: '80%' })
  css({ maskBottomFrom: '50%', maskRadialFrom: '35%', maskRadialAt: 'center' })
  ```

## 2.0.0-beta.14

## 2.0.0-beta.13

## 2.0.0-beta.12

## 2.0.0-beta.11

## 2.0.0-beta.10

### Minor Changes

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

## 2.0.0-beta.9

### Minor Changes

- Bring back `cssgen:done` as an observe-only hook for final CSS from CLI, Vite, and PostCSS. Use `optimize` or PostCSS
  if you need to mutate CSS.

### Patch Changes

- Support `minify` as a top-level config key. `cssgen` reads it from config; `--minify` still overrides it.

## 2.0.0-beta.6

### Minor Changes

- Adopt a published design system with `designSystem: '@acme/ds'`.

  Panda reads the library's `panda.lib.json`, merges its preset below your config, and reuses its pre-extracted styles.
  If the design system needs a different Panda major version, Panda reports a clear error.

## 2.0.0-beta.1

### Patch Changes

- Fix the `preset:resolved` hook missing its `utils` argument. Plugin authors can now use `omit` / `pick` / `traverse`
  inside `preset:resolved` (matching `config:resolved` and v1).

## 1.x and earlier

See the [v1 changelog](https://github.com/chakra-ui/panda/blob/v1/packages/types/CHANGELOG.md).
