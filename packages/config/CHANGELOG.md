# @pandacss/config

## 2.0.0-beta.10

### Minor Changes

- 05e085d: With a single-level `designSystem`, `panda codegen` reuses the library's styled-system instead of copying it.
  Your app only generates the delta (extra tokens, recipes, patterns). Missing library exports fail with
  `design_system_export_missing` instead of a silent bundler error.

  ```ts
  export default defineConfig({
    designSystem: '@acme/ds',
  })
  ```

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

### Patch Changes

- 05e085d: Fix `panda lib` / `panda buildinfo` writing `panda: "*"` when the design system has no `@pandacss/dev` peer.
  That range couldn't hydrate (`manifest requires Panda *`). Both commands now fall back to the running Panda major (for
  example `^2.0.0`). Pass `--panda` to set the range yourself.
- 05e085d: Stop `panda lib` from writing unpublishable peer ranges into `panda.lib.json`. A `catalog:` or `workspace:*`
  `@pandacss/dev` range now falls back to the running Panda's major instead of being stamped verbatim. Pass
  `--panda <range>` to set one explicitly.
- 05e085d: `panda lib` publishes machine artifacts under `./panda/*`, with manifest `files` paths relative to the lib
  outdir. Recipe/pattern runtime overlays only kick in when the design system owns that category.
- Updated dependencies [05e085d]
- Updated dependencies [f8027f3]
- Updated dependencies [ebe9f5b]
- Updated dependencies [52e84e6]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/compiler-shared@2.0.0-beta.10
  - @pandacss/types@2.0.0-beta.10

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
