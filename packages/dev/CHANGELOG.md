# @pandacss/dev

## 2.1.1

### Patch Changes

- Updated dependencies [576c72a]
- Updated dependencies [a63cb20]
- Updated dependencies [24718f4]
- Updated dependencies [b220f62]
- Updated dependencies [24718f4]
- Updated dependencies [8b6f7e0]
  - @pandacss/compiler@2.1.1
  - @pandacss/cli@2.1.1
  - @pandacss/postcss@2.1.1
  - @pandacss/config@2.1.1
  - @pandacss/types@2.1.1

## 2.1.0

### Patch Changes

- Updated dependencies [24ed80f]
- Updated dependencies [5da09d9]
- Updated dependencies [ee5c50b]
- Updated dependencies [ba062cd]
- Updated dependencies [ea34d1e]
- Updated dependencies [cd08564]
- Updated dependencies [76c5e6a]
- Updated dependencies [bd891e8]
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
  - @pandacss/cli@2.1.0
  - @pandacss/compiler@2.1.0
  - @pandacss/postcss@2.1.0
  - @pandacss/config@2.1.0
  - @pandacss/types@2.1.0

## 2.0.1

### Patch Changes

- Updated dependencies [0ad1e26]
- Updated dependencies [f9459ce]
  - @pandacss/compiler@2.0.1
  - @pandacss/cli@2.0.1
  - @pandacss/postcss@2.0.1
  - @pandacss/config@2.0.1
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
  - @pandacss/cli@2.0.0
  - @pandacss/compiler@2.0.0
  - @pandacss/config@2.0.0
  - @pandacss/postcss@2.0.0
  - @pandacss/types@2.0.0

## 2.0.0-beta.20

### Patch Changes

- Updated dependencies [882730a]
- Updated dependencies [9e45720]
- Updated dependencies [883ecd6]
- Updated dependencies [882730a]
  - @pandacss/compiler@2.0.0-beta.20
  - @pandacss/types@2.0.0-beta.20
  - @pandacss/cli@2.0.0-beta.20
  - @pandacss/postcss@2.0.0-beta.20
  - @pandacss/config@2.0.0-beta.20

## 2.0.0-beta.19

### Patch Changes

- Updated dependencies [384cfff]
- Updated dependencies [35e2ffc]
- Updated dependencies [c7f0dae]
- Updated dependencies [f256055]
- Updated dependencies [1f702e2]
- Updated dependencies [5078304]
  - @pandacss/compiler@2.0.0-beta.19
  - @pandacss/cli@2.0.0-beta.19
  - @pandacss/postcss@2.0.0-beta.19
  - @pandacss/config@2.0.0-beta.19
  - @pandacss/types@2.0.0-beta.19

## 2.0.0-beta.18

### Minor Changes

- 49d48c2: Add `@pandacss/dev/define`, the config helpers as a standalone module. Design systems can bundle it with
  `noExternal` without pulling in the rest of `@pandacss/dev`.

### Patch Changes

- Updated dependencies [aad2017]
- Updated dependencies [c9dd0f0]
- Updated dependencies [7e328bd]
- Updated dependencies [4466ac3]
- Updated dependencies [c9dd0f0]
- Updated dependencies [c5c4e2b]
- Updated dependencies [006e5c0]
- Updated dependencies [048c70c]
- Updated dependencies [4db4f75]
- Updated dependencies [8bbb6bb]
- Updated dependencies [c014979]
- Updated dependencies [c09573a]
- Updated dependencies [c9dd0f0]
  - @pandacss/cli@2.0.0-beta.18
  - @pandacss/compiler@2.0.0-beta.18
  - @pandacss/config@2.0.0-beta.18
  - @pandacss/postcss@2.0.0-beta.18
  - @pandacss/types@2.0.0-beta.18

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

### Patch Changes

- Updated dependencies [597d2cb]
- Updated dependencies [597d2cb]
- Updated dependencies [5b9a056]
- Updated dependencies [1ca20ab]
- Updated dependencies [8d29caa]
- Updated dependencies [323af68]
- Updated dependencies [55cab2b]
- Updated dependencies [bb47c38]
- Updated dependencies [774529f]
- Updated dependencies [e82613b]
- Updated dependencies [597d2cb]
  - @pandacss/cli@2.0.0-beta.17
  - @pandacss/compiler@2.0.0-beta.17
  - @pandacss/types@2.0.0-beta.17
  - @pandacss/config@2.0.0-beta.17
  - @pandacss/postcss@2.0.0-beta.17

## 2.0.0-beta.16

### Minor Changes

- f3f5847: Add a `defineConditions` helper so custom conditions get the same typed authoring experience as tokens,
  recipes, and the other config blocks.

  ```ts
  import { defineConditions } from '@pandacss/dev'

  export const conditions = defineConditions({
    hover: '&:is(:hover, [data-hover])',
  })
  ```

- 729ce72: Add the `definePositionTry` config helper for authoring `theme.positionTry` fallbacks outside `defineConfig`,
  matching `defineViewTransitions`.

### Patch Changes

- Updated dependencies [80e62a1]
- Updated dependencies [ce90eda]
- Updated dependencies [b9e7cd9]
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
  - @pandacss/cli@2.0.0-beta.16
  - @pandacss/config@2.0.0-beta.16
  - @pandacss/compiler@2.0.0-beta.16
  - @pandacss/types@2.0.0-beta.16
  - @pandacss/postcss@2.0.0-beta.16

## 2.0.0-beta.15

### Minor Changes

- e18eeb3: Add `theme.viewTransitions` so a preset can name shared view-transition bags. Call `viewTransition('slide')`
  and Panda inlines `"vt_slide"`. Unused names stay out of the CSS.

### Patch Changes

- Updated dependencies [8b43347]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [ec65db3]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [7c8a215]
- Updated dependencies [8885864]
- Updated dependencies [e18eeb3]
- Updated dependencies [2d5d152]
  - @pandacss/compiler@2.0.0-beta.15
  - @pandacss/types@2.0.0-beta.15
  - @pandacss/config@2.0.0-beta.15
  - @pandacss/cli@2.0.0-beta.15
  - @pandacss/postcss@2.0.0-beta.15

## 2.0.0-beta.14

### Patch Changes

- aa5ca7d: Fix `defineParts` returning an untyped object, which made the result unassignable to `base` or `variants` in
  `defineRecipe`.
- Updated dependencies [10014b4]
- Updated dependencies [a4f3944]
- Updated dependencies [9bcdcb0]
- Updated dependencies [ef7ffc7]
- Updated dependencies [6bcc885]
  - @pandacss/compiler@2.0.0-beta.14
  - @pandacss/cli@2.0.0-beta.14
  - @pandacss/postcss@2.0.0-beta.14
  - @pandacss/config@2.0.0-beta.14
  - @pandacss/types@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- Updated dependencies [b621edb]
  - @pandacss/compiler@2.0.0-beta.13
  - @pandacss/cli@2.0.0-beta.13
  - @pandacss/postcss@2.0.0-beta.13
  - @pandacss/config@2.0.0-beta.13
  - @pandacss/types@2.0.0-beta.13

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
  - @pandacss/cli@2.0.0-beta.12
  - @pandacss/postcss@2.0.0-beta.12
  - @pandacss/config@2.0.0-beta.12
  - @pandacss/types@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- Updated dependencies [c7f949a]
  - @pandacss/compiler@2.0.0-beta.11
  - @pandacss/cli@2.0.0-beta.11
  - @pandacss/postcss@2.0.0-beta.11
  - @pandacss/config@2.0.0-beta.11
  - @pandacss/types@2.0.0-beta.11

## 2.0.0-beta.10

### Patch Changes

- adc2142: Fold `panda info` into `panda doctor`. Doctor now prints the project summary and remains the pass/fail health
  check; `panda info` is removed.
- Updated dependencies [adc2142]
- Updated dependencies [2fa2373]
- Updated dependencies [05e085d]
- Updated dependencies [05e085d]
- Updated dependencies [d2bea8a]
- Updated dependencies [f8027f3]
- Updated dependencies [ebe9f5b]
- Updated dependencies [05e085d]
- Updated dependencies [52e84e6]
- Updated dependencies [05e085d]
- Updated dependencies [5c060e7]
- Updated dependencies [45bcfc1]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/cli@2.0.0-beta.10
  - @pandacss/compiler@2.0.0-beta.10
  - @pandacss/config@2.0.0-beta.10
  - @pandacss/types@2.0.0-beta.10
  - @pandacss/postcss@2.0.0-beta.10

## 2.0.0-beta.9

### Minor Changes

- Bring back `cssgen:done` as an observe-only hook for final CSS from CLI, Vite, and PostCSS. Use `optimize` or PostCSS
  if you need to mutate CSS.

## 2.0.0-beta.0

### Patch Changes

- Move MCP execution out of the Panda CLI and into the `@pandacss/mcp` package.

  - Add a `panda-mcp` binary so users can run the server with `npx -y @pandacss/mcp` or `pnpm dlx @pandacss/mcp`
  - Remove the `panda mcp` and `panda init-mcp` CLI bridge commands

## 1.x and earlier

See the [v1 changelog](https://github.com/chakra-ui/panda/blob/v1/packages/cli/CHANGELOG.md).
