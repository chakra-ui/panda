# Changelog

Each package keeps its own changelog. Start with [`@pandacss/dev`](./packages/dev/CHANGELOG.md), or browse
`packages/*/CHANGELOG.md`.

For Panda 1.x and earlier, see the [v1 changelog](https://github.com/chakra-ui/panda/blob/v1/CHANGELOG.md).

## [2.1.2](#2.1.2) - 2026-10-06

### Added

- `panda lib` now exports `./types`, so packages built on a design system can annotate their recipes and emit `.d.ts`
  files.
- Style helpers can now destructure their parameters, declare local `const` / `let` values, spread objects, and call
  other helpers. Panda still extracts their styles:

  ```ts
  const rule = (color: string) => ({ color })

  function card({ tone, size = 'md' }: { tone: string; size?: string }) {
    const border = `1px solid ${tone}`
    return { border, fontSize: size, ...rule(tone) }
  }

  css(card({ tone: 'red' }))
  ```

  A helper Panda can't evaluate, such as one with an `if` or a loop, now warns with `pure_helper_unevaluated` instead of
  silently skipping its styles.

### Changed

- In recipes and `globalCss`, the later key wins when two keys set the same CSS property, as in v1. `textStyle`,
  `layerStyle`, and `animationStyle` expand in place, so a property must come after them to override them:

  ```ts
  { color: 'blue', textStyle: 'body' } // the text style's color
  { textStyle: 'body', color: 'blue' } // blue
  ```

  Design systems need to rerun `panda lib` to regenerate their build info.

- Recipe CSS is grouped like atomic CSS, with shared media queries and merged rules. Output is smaller and matches v1's
  ordering.
- `token.var()` on negative spacing returns the original positive variable again, as in v1. `token()` still returns the
  negated value:

  ```ts
  token('spacing.-4') // calc(var(--spacing-4) * -1)
  token.var('spacing.-4') // var(--spacing-4)
  ```

  Emoji in token keys are no longer escaped in CSS variable names.

- `@pandacss/preset-base`, `@pandacss/preset-panda`, and `@pandacss/preset-typography` are now ESM-only, like the rest
  of v2. Panda still loads them from CommonJS configs. To `require()` them in your own code, use Node 22.12 or later.
- `@pandacss/typescript-plugin` and `@pandacss/language-server` are discontinued. TypeScript 7 has no tsserver plugin
  API, and the shared core broke on TS 7. 2.1.1 is the last version.

### Performance

- `panda` starts faster. Installed presets load with Node instead of being re-bundled on every run, and a build no
  longer loads the code for `init` and `debug`.
- `panda.config.ts` loads faster, and an error in your config is reported once instead of running the config again.
- File discovery skips directories no `include` pattern can match and enters each real directory once. In pnpm
  workspaces, includes like `../**/src/*.ts` no longer hang following linked packages.
- Generated pattern and style helpers no longer recreate their regular expressions on every call.

### Fixed

#### CSS output

- Fix recipe rules being emitted twice when both your app and a `designSystem` package use the same recipe.
- Fix slot recipes overriding recipe variants in minified production builds, like Vite 8's default build.
- Fix a boolean utility's `false` value, like `md: { srOnly: false }`, missing from the stylesheet.
- Fix `token.var()` references for keys containing dots, such as `spacing.1.5`, not matching the emitted CSS variables,
  including with `hash: true`.
- Fix a nested `DEFAULT` in `textStyles`, `layerStyles`, or `animationStyles` not being reachable through its parent
  key:

  ```ts
  const textStyles = defineTextStyles({
    body: { DEFAULT: { value: { fontSize: 'md' } }, sm: { value: { fontSize: 'sm' } } },
  })

  css({ textStyle: 'body' }) // now emits CSS, and is typed as "body" instead of "body.DEFAULT"
  ```

- Fix `brand.500/60 !important` warning about an invalid opacity modifier.

#### Extraction

- Fix `.mdx` files in `include` getting no CSS, a regression from v1. Panda extracts JSX style props and `css()` calls
  from MDX again and skips code examples in Markdown.
- Fix styles going missing in Astro, Svelte, and Vue files when the markup has a regex or comment inside an expression.
  `css()` calls in Astro client `<script>` blocks now get their CSS too.
- Fix default values of parameters and destructured props, like `function Button({ size = 'md' })`, not generating CSS.

#### Codegen and types

- Fix config recipes throwing `TypeError: v.charCodeAt is not a function` with `hash: true`.
- Fix generated code failing to type-check with `outExtension: 'ts'`. `styled-system` now passes a strict type check for
  React, Preact, Solid, and Vue, with far fewer `any` types.
- Fix a type error when passing `css` or style props in `styled()`'s `defaultProps`.
- Fix `sva()` rejecting a readonly `slots` array declared `as const` (TS4104).
- Fix `css.raw()`, `cva().raw()`, `sva().raw()`, and `splitCssProps()` returning null-prototype objects, which broke
  `toStrictEqual`, `hasOwnProperty`, and string coercion.
- Fix `panda codegen` failing with `design_system_export_missing` for `./jsx` when a `designSystem` has no
  `jsxFramework`.

#### Tooling

- Fix trace files written with `PANDA_TRACE` being cut short. The trace now finishes when the process exits, including
  in the Vite and PostCSS plugins.

## [2.1.1](#2.1.1) - 2026-10-02

### Changed

- `colorPalette.include` and `exclude` pick palettes by name, and each palette keeps all of its tokens. Themes with many
  nested groups can drop nested palettes from the `strictTokens` union without losing any virtual token:

  ```ts
  export default defineConfig({
    theme: {
      // `gray` stays a palette with colorPalette.1 and colorPalette.solid.bg; `gray.solid` is dropped
      colorPalette: { exclude: ['*.*'] },
    },
  })
  ```

- `strictTokens` accepts common CSS keywords that have no token, like `maxWidth: 'none'` and `float: 'left'`.
  `transitionProperty` accepts any property name or list, like `'opacity, transform'`.

### Fixed

- Fix slot recipes overriding recipe variants with the Vite, PostCSS, webpack, or Bun plugins. Your stylesheet only
  needs the top-level layer order, so you can remove any `@layer recipes.base, …` workaround:

  ```css
  @layer reset, base, tokens, recipes, utilities;
  ```

- Fix dev and watch mode ignoring edits to files outside the project root, such as a sibling package in a monorepo, and
  files reported through a symlink.
- Fix `forwardProps` typing a forwarded prop as the CSS one when it shares a name with a style prop, like `position`.

## [2.1.0](#2.1.0) - 2026-10-01

### Added

- Add `get_usage_report` to the MCP server to audit how a project uses tokens, recipes, utilities, patterns, and
  keyframes.
- Warn when styles are nested under a key that isn't a condition or selector. These styles never applied:

  ```ts
  css({ has: { svg: { color: 'red' } } }) // warns and suggests '&:has(svg)'
  ```

### Changed

- `--include` accepts brace globs, and commas are now part of the glob. Repeat the flag for more than one glob (same for
  `panda lib --files`):

  ```sh
  panda cssgen --include "src/**/*.{ts,tsx}" --include "app/**/*.tsx"
  ```

- `ComponentPropsOf` is now `ComponentProps` in the generated `jsx` types of every framework.

### Fixed

#### CSS output

- Fix nested conditions applying in the wrong order. Hovering a button recolors its icon again:

  ```ts
  css({ _hover: { _icon: { color: 'red' } } })
  // before: .x :where(svg):hover
  // after:  .x:hover :where(svg)
  ```

- Fix a recipe's own properties losing to a `textStyle`, `layerStyle`, or `animationStyle` in the same recipe:

  ```ts
  base: { textStyle: 'body', fontWeight: 'medium' } // now medium
  ```

- Fix negative token references like `{spacing.-2}` emitting an empty rule, and `{colors.red}` not resolving without a
  preset.
- Fix missing styles when a ternary tests a value initialized with `??`, `||`, or `&&`.
- Fix `polyfill: true` breaking class names with escaped characters (`:`, `,`, `"`, `#`), and letting unlayered
  `!important` CSS override Panda's `!important` utilities.

#### Extraction

- Fix `<Card.Root>` getting no CSS when rendered in the same file that defines `Card`.
- Fix `createSlotRecipeContext` dropping `sva()` slot classes (`card__root`, `card__title`, …) in React, Preact, and
  Vue.
- Fix `styled()` emitting component defaults such as `srcDoc` as CSS.
- Fix Vue template styles being ignored after a nested `<template>`, such as a `v-if` group or a slot.

#### Types

- Fix `styled()` and recipe context components not being assignable to `ComponentType<Props>` when `Props` is an
  interface.
- Fix Solid components built with `createRecipeContext` / `createSlotRecipeContext` losing their prop types.
- Fix `undefined` being rejected under `exactOptionalPropertyTypes`, as in
  `css({ color: isActive ? 'red' : undefined })`.
- Fix slot recipe calls like `card().root` not being typed as `string`, and `variantMap` arrays including `undefined`.

#### Tooling

- Fix ESLint `prefer-token` false positives for token ternaries and utilities like `flex`. Unknown condition warnings
  now go through `extraction-diagnostics`.
- Fix the Vite and Bun plugins printing each warning twice.
- Fix the MCP server reporting the wrong package version.

## [2.0.1](#2.0.1) - 2026-10-01

### Fixed

- Fix ternary values in pattern props. Each branch now gets its own CSS.

  ```tsx
  <Stack gap={compact ? '2' : '4'} />
  ```

- Fix `transform: true` skipping `.svelte`, `.vue`, and `.astro` files in Vite, and `.vue` files in webpack and rspack.
  Static style calls in these files now compile to class names.
