# @pandacss/config

## 2.0.0-beta.8

### Patch Changes

- Updated dependencies [72580e5]
  - @pandacss/compiler-shared@2.0.0-beta.8
  - @pandacss/types@2.0.0-beta.8

## 2.0.0-beta.7

### Patch Changes

- @pandacss/compiler-shared@2.0.0-beta.7
- @pandacss/types@2.0.0-beta.7

## 2.0.0-beta.6

### Minor Changes

- b5a620d: Add `panda lib` to package a Panda design system.

  It scans your library source, writes `panda.lib.json`, `panda.buildinfo.json`, and `panda.preset.mjs`, then syncs the
  package exports. It can also run in watch mode.

  Consumers also get token conflict warnings when the app and design system define the same token path; the app value
  wins. If a library's build info is stale, Panda re-extracts its manifest `files` instead of failing the build.

- 7b71a43: Adopt a published design system with `designSystem: '@acme/ds'`.

  Panda reads the library's `panda.lib.json`, merges its preset below your config, and reuses its pre-extracted styles.
  If the design system needs a different Panda major version, Panda reports a clear error.

### Patch Changes

- Updated dependencies [8a936bd]
- Updated dependencies [82e7811]
- Updated dependencies [b5a620d]
- Updated dependencies [7b71a43]
  - @pandacss/compiler-shared@2.0.0-beta.6
  - @pandacss/types@2.0.0-beta.6

## 2.0.0-beta.5

### Patch Changes

- @pandacss/compiler-shared@2.0.0-beta.5
- @pandacss/types@2.0.0-beta.5

## 2.0.0-beta.4

### Patch Changes

- Updated dependencies [23580df]
  - @pandacss/compiler-shared@2.0.0-beta.4
  - @pandacss/types@2.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- @pandacss/compiler-shared@2.0.0-beta.3
- @pandacss/types@2.0.0-beta.3

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
