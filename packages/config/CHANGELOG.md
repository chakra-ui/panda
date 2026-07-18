# @pandacss/config

## 2.0.0-beta.9

### Minor Changes

- Bring back `cssgen:done` as an observe-only hook for final CSS from CLI, Vite, and PostCSS. Use `optimize` or PostCSS
  if you need to mutate CSS.

### Patch Changes

- Design-system build info loads more reliably when packages are nested, files are stale, or options do not match. You
  get clearer errors for token conflicts and mismatched config.
- Config bundling loads rolldown only when your config needs it, so simple commands start faster.
- Clearer `designSystem` errors for bad manifests, missing exports, unsupported protocols, and duplicate names.
- `panda lib` keeps array-form package.json `exports` and warns when it overwrites a subpath you already set.
- `panda lib` omits inferred `files` that package.json `"files"` would not publish, and warns with a `--files` tip for
  dist-only packages.
- `panda lib` resolves `npm:` peer aliases (like `npm:@pandacss/dev@^3.0.0`) into a real `panda` range in the manifest,
  same as `workspace:` and `catalog:`.

## 2.0.0-beta.6

### Minor Changes

- Add `panda lib` to package a Panda design system.

  It scans your library source, writes `panda.lib.json`, `panda.buildinfo.json`, and `panda.preset.mjs`, then syncs the
  package exports. It can also run in watch mode.

  Consumers also get token conflict warnings when the app and design system define the same token path; the app value
  wins. If a library's build info is stale, Panda re-extracts its manifest `files` instead of failing the build.

- Adopt a published design system with `designSystem: '@acme/ds'`.

  Panda reads the library's `panda.lib.json`, merges its preset below your config, and reuses its pre-extracted styles.
  If the design system needs a different Panda major version, Panda reports a clear error.

## 2.0.0-beta.1

### Patch Changes

- Fix config loading failing with `The argument 'filename' must be a file URL … Received 'data:…'` when the config
  imports a CommonJS preset that uses `require()` (e.g. `pandacss-preset-typography`).

  The bundled config is now evaluated from a temporary file (imported via a `file://` URL) instead of a `data:` URL, so
  rolldown's `createRequire(import.meta.url)` interop resolves against a real path. Falls back to a `data:` URL when the
  temp file can't be written. This also loads faster for larger configs.

- Fix the `preset:resolved` hook missing its `utils` argument. Plugin authors can now use `omit` / `pick` / `traverse`
  inside `preset:resolved` (matching `config:resolved` and v1).
