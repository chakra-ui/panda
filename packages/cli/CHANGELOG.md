# @pandacss/cli

## 2.0.0-beta.9

### Minor Changes

- ea9ccae: Add `--profile` to any command. It writes `trace.json` (open in `chrome://tracing` or `ui.perfetto.dev`) and
  `timings.json` (per-span totals and slowest files) to `.panda/`, or into `panda debug --outdir` when combined with
  `debug`. Replaces v1's `--cpu-prof`, which couldn't see time spent in the Rust engine.

### Patch Changes

- 682338e: - Keep nested design-system build info package-local, and safely re-extract source when build info is stale,
  malformed, or corrupt.
  - Normalize workspace Panda ranges and warn when effective consumer class-name options differ from the library.
  - Preserve recipe cascade order, compound variants, and runtime token references when hydrating design-system build
    info.
  - Validate manifests before loading presets, and reconcile token ownership and class-name compatibility after config
    hooks.
  - Make hydration diagnostics actionable and CI-correct, with reason-specific fallback errors and grouped token
    conflicts.
- 31aa2c4: Replaced `zod` with a small local flag validator. `zod` resolved ~76 separate ESM files at CLI startup;
  removing it cuts a meaningful chunk of Node's module-loading overhead on every `panda` invocation, most noticeable on
  fast commands like `codegen`.
- 8b6d08f: Support `minify` as a top-level config key. The migration guide and `panda cssgen --minify` already treated
  it as one, but the `Config` type rejected it and nothing read it. `cssgen` now honors `minify` from config, and the
  `--minify` flag still overrides it.
- d8e8465: `panda lib` omits inferred fallback `files` that package.json `"files"` would not publish, and warns with a
  `--files` tip for dist-only packages.
- 32d60cf: Fix `panda --watch` crashing on macOS with
  `Error: Events were dropped by the FSEvents client. File system must be re-scanned.`

  `@parcel/watcher` surfaces a macOS FSEvents backpressure condition — its event buffer overflowed and the OS coalesced
  the backlog — as a _recoverable_ subscribe-callback error. Apple's FSEvents API sets
  `kFSEventStreamEventFlagMustScanSubDirs` and expects the client to re-scan. The watcher was rethrowing this error
  inside `@parcel/watcher`'s native callback, which becomes an uncaught exception and kills the watch process (commonly
  hit when `panda --watch` runs next to a bundler's dependency pre-bundle, e.g. `vite`). It now recognizes the "must be
  re-scanned" signal and triggers a full re-scan — re-reading every source file from disk — instead of crashing; any
  other error is left to propagate unchanged.

- Updated dependencies [9409487]
- Updated dependencies [682338e]
- Updated dependencies [ea9ccae]
- Updated dependencies [56013a1]
- Updated dependencies [853bb65]
- Updated dependencies [8b6d08f]
- Updated dependencies [95e5501]
- Updated dependencies [05c5125]
- Updated dependencies [b7ab62c]
- Updated dependencies [8b6d08f]
- Updated dependencies [d8e8465]
- Updated dependencies [6e3c160]
- Updated dependencies [f8f3124]
- Updated dependencies [8b6d08f]
- Updated dependencies [0f88913]
- Updated dependencies [682338e]
- Updated dependencies [33fa885]
- Updated dependencies [e0d46e5]
  - @pandacss/compiler@2.0.0-beta.9
  - @pandacss/compiler-shared@2.0.0-beta.9
  - @pandacss/config@2.0.0-beta.9

## 2.0.0-beta.8

### Patch Changes

- Updated dependencies [72580e5]
  - @pandacss/compiler-shared@2.0.0-beta.8
  - @pandacss/compiler@2.0.0-beta.8
  - @pandacss/config@2.0.0-beta.8

## 2.0.0-beta.7

### Patch Changes

- Updated dependencies [97d142a]
- Updated dependencies [0a11fda]
  - @pandacss/compiler@2.0.0-beta.7
  - @pandacss/compiler-shared@2.0.0-beta.7
  - @pandacss/config@2.0.0-beta.7

## 2.0.0-beta.6

### Minor Changes

- b5a620d: Add `panda lib` to package a Panda design system.

  It scans your library source, writes `panda.lib.json`, `panda.buildinfo.json`, and `panda.preset.mjs`, then syncs the
  package exports. It can also run in watch mode.

  Consumers also get token conflict warnings when the app and design system define the same token path; the app value
  wins. If a library's build info is stale, Panda re-extracts its manifest `files` instead of failing the build.

### Patch Changes

- 8a936bd: Add `panda analyze` reports. You can write JSON, open a static HTML report, or run the live report UI.
- Updated dependencies [8a936bd]
- Updated dependencies [82e7811]
- Updated dependencies [b5a620d]
- Updated dependencies [7b71a43]
- Updated dependencies [d075c2b]
- Updated dependencies [86504d6]
  - @pandacss/compiler@2.0.0-beta.6
  - @pandacss/compiler-shared@2.0.0-beta.6
  - @pandacss/config@2.0.0-beta.6

## 2.0.0-beta.5

### Patch Changes

- Updated dependencies [a9c6e47]
  - @pandacss/compiler@2.0.0-beta.5
  - @pandacss/compiler-shared@2.0.0-beta.5
  - @pandacss/config@2.0.0-beta.5

## 2.0.0-beta.4

### Minor Changes

- 9521059: Add a `--include` flag to the scanning commands (`panda`, `build`, `dev`, `check`, `cssgen`, `debug`, `info`,
  `buildinfo`) to override the config's `include` globs for a single run. The flag is repeatable and accepts
  comma-separated values, and replaces (does not merge with) the configured globs — useful for scanning a subset of
  files in CI or one-off builds.

### Patch Changes

- Updated dependencies [9521059]
- Updated dependencies [74dab7b]
- Updated dependencies [0202dba]
- Updated dependencies [23580df]
- Updated dependencies [5316642]
- Updated dependencies [1378d4a]
  - @pandacss/compiler@2.0.0-beta.4
  - @pandacss/compiler-shared@2.0.0-beta.4
  - @pandacss/config@2.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- Updated dependencies [2117c7a]
- Updated dependencies [1d1ec6c]
- Updated dependencies [21dc46a]
- Updated dependencies [6a61a2d]
- Updated dependencies [376d6f2]
  - @pandacss/compiler@2.0.0-beta.3
  - @pandacss/compiler-shared@2.0.0-beta.3
  - @pandacss/config@2.0.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- 0b77f58: Skip rewriting generated files when the content is unchanged, so watch mode no longer bumps mtimes and
  triggers extra reloads/rebuilds for no-op codegen and CSS writes.

  The compiler write APIs now use object params consistently:

  - `writeArtifacts({ outdir, cwd, forceImportExtension, artifacts })`
  - `writeCss({ outfile, cwd, emitLayerDeclaration })`
  - `writeSplitCss({ outdir, cwd })`

- Updated dependencies [bc39e0f]
- Updated dependencies [ac3eba5]
- Updated dependencies [adc8d7c]
- Updated dependencies [0b77f58]
  - @pandacss/compiler@2.0.0-beta.2
  - @pandacss/compiler-shared@2.0.0-beta.2
  - @pandacss/config@2.0.0-beta.2

## 2.0.0-beta.1

### Minor Changes

- 213eb37: Add the default `panda` command (no subcommand) that runs the full build — codegen then cssgen — in a single
  driver pass, restoring the v1 ergonomic where the common case is one word.

  - Shares the build across both passes (one config load, merged diagnostics, one summary line).
  - Supports `--outdir`, `--outfile`, `--splitting`, `--clean`, `--check`, `--watch`, and the common flags. `--outdir`
    relocates both the generated system and the CSS file under one root.
  - Named subcommands (`codegen`, `cssgen`, `init`, …) must come first (`panda codegen …`); a leading flag runs the
    default build (`panda --watch`).

- 213eb37: Add the `panda debug` command — dumps the resolved config and per-file extraction for bug reports.

  - writes `info.json` (platform, node, config path), `config.json`, `<file>.extract.json` per source, and the project
    `styles.css` under `<outdir>/debug`.
  - flags: `--outdir`, `--dry` (print to stdout), `--only-config`.
  - v2 emits atomic CSS at the project level, so the dump carries one project stylesheet rather than a per-file slice.

### Patch Changes

- 88095b5: Scaffold and install the default presets in `panda init` so new projects are styled out of the box.

  v2 resolves presets explicitly — a config without `presets` produces a bare system (no `bg`/`color` utilities, no
  `fontSizes`/spacing scales, no `_hover`/`_active` conditions). The generated `panda.config.ts` now includes
  `presets: ['@pandacss/preset-base', '@pandacss/preset-panda']`, and `panda init` installs both as devDependencies of
  the project so the string specifiers resolve from the project root — including under pnpm's isolated `node_modules`.

  - the package manager is detected from the `packageManager` field (corepack), then the lockfile, defaulting to npm.
  - `--no-install` opts out: scaffolds a bare config (`presets: []`) and installs nothing.
  - with no usable `package.json`, the config is scaffolded bare and a hint explains what to add — codegen still
    succeeds.
  - re-running `init` on an existing config doesn't touch dependencies; `--force` re-scaffolds and installs.

- f7315fe: Improve the CLI surface with standard devtool commands and version output.

  - Add `panda build`, `panda dev`, `panda check`, `panda info`, and `panda doctor`.
  - Keep advanced `codegen`, `cssgen`, and `buildinfo` commands working.
  - Replace `inspect` with `info` and `validate` with `doctor`.
  - Replace `--silent`, `--quiet`, and `--verbose` with `--log-level`.
  - Use kebab-case shared flags like `--max-warnings`, `--watch-debounce`, `--trace-output`, and `--trace-file`.
  - Validate CLI flags with typed schemas and report invalid values clearly.
  - Fix `panda --version` and `panda -v` to print the CLI package version.

- Updated dependencies [349e7ef]
- Updated dependencies [07eafef]
  - @pandacss/config@2.0.0-beta.1
  - @pandacss/compiler@2.0.0-beta.1
  - @pandacss/compiler-shared@2.0.0-beta.1

## 2.0.0-beta.0

### Major Changes

- 4f7e283: Panda CSS v2 — the compiler hot path is rewritten in Rust (Oxc-based engine) and shipped via the native
  `@pandacss/compiler` binding, with a `@pandacss/compiler-wasm` build for the browser. This is the first `2.0.0-beta`
  pre-release.

  Highlights:

  - Rust/Oxc extraction and CSS emission replacing the `ts-morph` + `ts-evaluator` pipeline.
  - CLI published as `@pandacss/cli` (the `panda` / `pandacss` binaries are unchanged).
  - v1 (`1.x`) remains on the `latest` dist-tag; v2 betas publish under the `beta` dist-tag.

  Since `@pandacss/**` is a fixed version group, this major bump applies to every published Panda package.

### Patch Changes

- Updated dependencies [b567ae6]
- Updated dependencies [8e66595]
- Updated dependencies [cc30235]
- Updated dependencies [939a3d9]
- Updated dependencies [742d649]
  - @pandacss/compiler@2.0.0-beta.0
  - @pandacss/compiler-shared@2.0.0-beta.0
  - @pandacss/config@2.0.0-beta.0
