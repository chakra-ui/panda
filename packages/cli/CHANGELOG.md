# @pandacss/cli

## 2.0.0-beta.10

### Minor Changes

- adc2142: Fold `panda info` into `panda doctor`. Doctor now prints the project summary and remains the pass/fail health
  check; `panda info` is removed.
- 2fa2373: `panda init -i` runs the setup wizard again, including prompts for `outExtension` and `jsxStyleProps`, with
  colored terminal output and next-step hints.
- 52e84e6: Add native cascade-layer polyfill via `polyfill` / `--polyfill` (no PostCSS plugin required).
- 45bcfc1: `panda init --no-install` is now `--skip-presets`. Same idea: scaffold a bare config without adding the
  default preset packages. Programmatic callers use `skipPresets` instead of `install: false`.

  ```bash
  panda init --skip-presets
  ```

### Patch Changes

- 05e085d: Fix `panda lib` / `panda buildinfo` writing `panda: "*"` when the design system has no `@pandacss/dev` peer.
  That range couldn't hydrate (`manifest requires Panda *`). Both commands now fall back to the running Panda major (for
  example `^2.0.0`). Pass `--panda` to set the range yourself.
- f8027f3: Fix CSS cascade order, token pruning, and conditional JSX spreads where a later static prop overrides a
  spread. Design-system tree-shaking now runs before every CSS read/write path, not only `cssgen` / `writeCss`.

  `getSplitCss()` is a breaking shape change for direct callers:

  ```ts
  // before
  const files = compiler.getSplitCss()

  // after
  const { files, diagnostics } = compiler.getSplitCss()
  ```

- 05e085d: `panda lib` publishes machine artifacts under `./panda/*`, with manifest `files` paths relative to the lib
  outdir. Recipe/pattern runtime overlays only kick in when the design system owns that category.
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
  - @pandacss/config@2.0.0-beta.10
  - @pandacss/types@2.0.0-beta.10

## 2.0.0-beta.9

### Minor Changes

- Add `--profile` to any command. It writes `trace.json` and `timings.json` to `.panda/` (or into
  `panda debug --outdir`). Open the trace in `chrome://tracing` or `ui.perfetto.dev`. Replaces v1's `--cpu-prof`.

### Patch Changes

- Design-system build info loads more reliably when packages are nested, files are stale, or options do not match. You
  get clearer errors for token conflicts and mismatched config.
- Faster CLI startup: flag parsing no longer loads zod on every `panda` run.
- Support `minify` as a top-level config key. `cssgen` reads it from config; `--minify` still overrides it.
- `panda lib` omits inferred `files` that package.json `"files"` would not publish, and warns with a `--files` tip for
  dist-only packages.
- Fix `panda --watch` crashing on macOS when FSEvents drops events. The watcher now re-scans instead of exiting.

## 2.0.0-beta.6

### Minor Changes

- Add `panda lib` to package a Panda design system.

  It scans your library source, writes `panda.lib.json`, `panda.buildinfo.json`, and `panda.preset.mjs`, then syncs the
  package exports. It can also run in watch mode.

  Consumers also get token conflict warnings when the app and design system define the same token path; the app value
  wins. If a library's build info is stale, Panda re-extracts its manifest `files` instead of failing the build.

### Patch Changes

- Add `panda analyze` reports. You can write JSON, open a static HTML report, or run the live report UI.

## 2.0.0-beta.4

### Minor Changes

- Add a `--include` flag to the scanning commands (`panda`, `build`, `dev`, `check`, `cssgen`, `debug`, `info`,
  `buildinfo`) to override the config's `include` globs for a single run. The flag is repeatable and accepts
  comma-separated values, and replaces (does not merge with) the configured globs — useful for scanning a subset of
  files in CI or one-off builds.

## 2.0.0-beta.2

### Patch Changes

- Skip rewriting generated files when the content is unchanged, so watch mode no longer bumps mtimes and triggers extra
  reloads/rebuilds for no-op codegen and CSS writes.

  The compiler write APIs now use object params consistently:

  - `writeArtifacts({ outdir, cwd, forceImportExtension, artifacts })`
  - `writeCss({ outfile, cwd, emitLayerDeclaration })`
  - `writeSplitCss({ outdir, cwd })`

## 2.0.0-beta.1

### Minor Changes

- Add the default `panda` command (no subcommand) that runs the full build — codegen then cssgen — in a single driver
  pass, restoring the v1 ergonomic where the common case is one word.

  - Shares the build across both passes (one config load, merged diagnostics, one summary line).
  - Supports `--outdir`, `--outfile`, `--splitting`, `--clean`, `--check`, `--watch`, and the common flags. `--outdir`
    relocates both the generated system and the CSS file under one root.
  - Named subcommands (`codegen`, `cssgen`, `init`, …) must come first (`panda codegen …`); a leading flag runs the
    default build (`panda --watch`).

- Add the `panda debug` command — dumps the resolved config and per-file extraction for bug reports.

  - writes `info.json` (platform, node, config path), `config.json`, `<file>.extract.json` per source, and the project
    `styles.css` under `<outdir>/debug`.
  - flags: `--outdir`, `--dry` (print to stdout), `--only-config`.
  - v2 emits atomic CSS at the project level, so the dump carries one project stylesheet rather than a per-file slice.

### Patch Changes

- Scaffold and install the default presets in `panda init` so new projects are styled out of the box.

  v2 resolves presets explicitly — a config without `presets` produces a bare system (no `bg`/`color` utilities, no
  `fontSizes`/spacing scales, no `_hover`/`_active` conditions). The generated `panda.config.ts` now includes
  `presets: ['@pandacss/preset-base', '@pandacss/preset-panda']`, and `panda init` installs both as devDependencies of
  the project so the string specifiers resolve from the project root — including under pnpm's isolated `node_modules`.

  - the package manager is detected from the `packageManager` field (corepack), then the lockfile, defaulting to npm.
  - `--no-install` opts out: scaffolds a bare config (`presets: []`) and installs nothing.
  - with no usable `package.json`, the config is scaffolded bare and a hint explains what to add — codegen still
    succeeds.
  - re-running `init` on an existing config doesn't touch dependencies; `--force` re-scaffolds and installs.

- Improve the CLI surface with standard devtool commands and version output.

  - Add `panda build`, `panda dev`, `panda check`, `panda info`, and `panda doctor`.
  - Keep advanced `codegen`, `cssgen`, and `buildinfo` commands working.
  - Replace `inspect` with `info` and `validate` with `doctor`.
  - Replace `--silent`, `--quiet`, and `--verbose` with `--log-level`.
  - Use kebab-case shared flags like `--max-warnings`, `--watch-debounce`, `--trace-output`, and `--trace-file`.
  - Validate CLI flags with typed schemas and report invalid values clearly.
  - Fix `panda --version` and `panda -v` to print the CLI package version.

## 2.0.0-beta.0

### Major Changes

- Panda CSS v2 — the compiler hot path is rewritten in Rust (Oxc-based engine) and shipped via the native
  `@pandacss/compiler` binding, with a `@pandacss/compiler-wasm` build for the browser. This is the first `2.0.0-beta`
  pre-release.

  Highlights:

  - Rust/Oxc extraction and CSS emission replacing the `ts-morph` + `ts-evaluator` pipeline.
  - CLI published as `@pandacss/cli` (the `panda` / `pandacss` binaries are unchanged).
  - v1 (`1.x`) remains on the `latest` dist-tag; v2 betas publish under the `beta` dist-tag.

  Since `@pandacss/**` is a fixed version group, this major bump applies to every published Panda package.
