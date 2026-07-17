# @pandacss/config

## 2.0.0-beta.9

### Minor Changes

- 8b6d08f: Bring back `cssgen:done` as an observe-only host hook for reporting on final CSS from CLI, Vite, and PostCSS.
  Use `optimize` or PostCSS to mutate CSS.

### Patch Changes

- 682338e: Harden design-system build-info hydration: keep nested packages local, fall back safely when build info is
  stale or corrupt, and surface clearer option-mismatch and token-ownership diagnostics.
- 56013a1: Config bundling is now lazy. `rolldown` is only `import()`-ed when a config actually needs bundling, instead
  of loading eagerly on every `@pandacss/config` import — cuts a meaningful chunk of per-command startup overhead.
- 95e5501: Improve `designSystem` resolution errors for invalid manifests and presets, missing manifest exports,
  unsupported protocol specifiers, and duplicate manifest names.
- 8b6d08f: `panda lib` keeps array-form package.json `exports` and warns when it overwrites a subpath you already set.
- d8e8465: `panda lib` omits inferred fallback `files` that package.json `"files"` would not publish, and warns with a
  `--files` tip for dist-only packages.
- 8b6d08f: `panda lib` now resolves `npm:` peer aliases (like `npm:@pandacss/dev@^3.0.0`) into a real `panda` range in
  the manifest, same as `workspace:` and `catalog:`.
- Updated dependencies [9409487]
- Updated dependencies [682338e]
- Updated dependencies [8b6d08f]
- Updated dependencies [8b6d08f]
- Updated dependencies [682338e]
  - @pandacss/compiler-shared@2.0.0-beta.9
  - @pandacss/types@2.0.0-beta.9

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
