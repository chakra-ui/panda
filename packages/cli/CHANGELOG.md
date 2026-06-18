# @pandacss/cli

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
