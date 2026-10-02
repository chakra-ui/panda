# Changelog

Each package keeps its own changelog. Start with [`@pandacss/dev`](./packages/dev/CHANGELOG.md), or browse
`packages/*/CHANGELOG.md`.

For Panda 1.x and earlier, see the [v1 changelog](https://github.com/chakra-ui/panda/blob/v1/CHANGELOG.md).

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
