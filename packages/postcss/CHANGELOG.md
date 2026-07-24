# @pandacss/postcss

## 2.0.0-beta.10

### Patch Changes

- 52e84e6: Add native cascade-layer polyfill via `polyfill` / `--polyfill` (no PostCSS plugin required).
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

## 2.0.0-beta.9

### Patch Changes

- Design-system build info loads more reliably when packages are nested, files are stale, or options do not match. You
  get clearer errors for token conflicts and mismatched config.

## 2.0.0-beta.8

### Patch Changes

- Fix PostCSS HMR style updates.

  Component edits now keep previous atoms available during refresh, and design-system source fallback files refresh
  through the driver instead of waiting for a restart.

## 2.0.0-beta.7

### Patch Changes

- Fix hot module reloading with the PostCSS integration (`@pandacss/dev/postcss`). Editing a component now updates its
  styles live, instead of leaving them stale until you restart the dev server.

## 2.0.0-beta.0

### Patch Changes

- Add an experimental PostCSS integration backed by the v2 compiler driver.
