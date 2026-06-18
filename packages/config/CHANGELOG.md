# @pandacss/config

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies [0b77f58]
  - @pandacss/compiler-shared@2.0.0-beta.2
  - @pandacss/types@2.0.0-beta.2

## 2.0.0-beta.1

### Patch Changes

- 349e7ef: Fix config loading failing with `The argument 'filename' must be a file URL … Received 'data:…'` when the
  config imports a CommonJS preset that uses `require()` (e.g. `pandacss-preset-typography`).

  The bundled config is now evaluated from a temporary file (imported via a `file://` URL) instead of a `data:` URL, so
  rolldown's `createRequire(import.meta.url)` interop resolves against a real path. Falls back to a `data:` URL when the
  temp file can't be written. This also loads faster for larger configs.

- 07eafef: Fix the `preset:resolved` hook missing its `utils` argument. Plugin authors can now use `omit` / `pick` /
  `traverse` inside `preset:resolved` (matching `config:resolved` and v1).
- Updated dependencies [07eafef]
  - @pandacss/types@2.0.0-beta.1
  - @pandacss/compiler-shared@2.0.0-beta.1

## 2.0.0-beta.0

### Patch Changes

- Updated dependencies [742d649]
  - @pandacss/compiler-shared@2.0.0-beta.0
  - @pandacss/types@2.0.0-beta.0
