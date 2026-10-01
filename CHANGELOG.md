# Changelog

Each package keeps its own changelog. Start with [`@pandacss/dev`](./packages/dev/CHANGELOG.md), or browse
`packages/*/CHANGELOG.md`.

For Panda 1.x and earlier, see the [v1 changelog](https://github.com/chakra-ui/panda/blob/v1/CHANGELOG.md).

## [2.0.1](#2.0.1) - 2026-10-01

### Fixed

- Fix ternary values in pattern props. Each branch now gets its own CSS.

  ```tsx
  <Stack gap={compact ? '2' : '4'} />
  ```

- Fix `transform: true` skipping `.svelte`, `.vue`, and `.astro` files in Vite, and `.vue` files in webpack and rspack.
  Static style calls in these files now compile to class names.
