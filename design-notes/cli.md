---
title: CLI v2 Direction
status: draft
scope:
  - packages/cli_v2
  - packages/compiler
  - packages/compiler-shared
  - packages/config-loader
  - packages/vite
  - packages/postcss_v2
---

# CLI v2 Direction

## Summary

`packages/cli_v2` should be the production host for the Rust compiler, not just a thin benchmark shell. The current
commands (`codegen`, `cssgen`, `inspect`) prove the driver API works, but enterprise adoption needs stronger
diagnostics, CI contracts, validation, watch behavior, and observability.

The direction is to keep the command set small at first and make the core commands excellent before porting every legacy
CLI feature. Popular devtool CLIs such as Vite, Next.js, ESLint, Prisma, Tailwind, Cargo, and Rolldown converge on the
same pattern: predictable flags, clear diagnostics, machine-readable output, and debuggability for CI and large teams.

## Current State

`cli_v2` currently exposes:

```sh
panda codegen
panda cssgen
panda inspect
```

The implementation is built around `createNodeDriver()` and the compiler driver methods:

- `driver.codegen()`
- `driver.parseFiles()`
- `driver.writeCss()`
- `driver.writeSplitCss()`
- `driver.reload()`
- `driver.applyChanges()`

This is the right foundation. The gap is the CLI host layer around it.

## Reference Patterns

Vite favors a compact command surface with global debug/config/log flags and clear watch/dev output. Tailwind keeps its
CSS build command simple but supports production essentials like input/output, watch, minify, source maps, stdin/stdout,
and silent mode.

ESLint is the strongest model for CI and diagnostics: `--format json`, warning thresholds, cache/check modes, clear exit
codes, and dedicated config/debug commands. Prisma is the strongest model for lifecycle tooling: `init`, `generate`,
`validate`, `format`, `debug`, and `studio` map to concrete project tasks. Next.js is the strongest model for
operational debugging: `info`, `--debug`, CPU profiling, build summaries, and targeted debug modes.

Rolldown's `rolldown_error` crate is the closest architectural reference for a Rust-backed JS tool. It separates typed
build events from rendered diagnostics, gives every event a stable `EventKind`, carries severity separately, batches
diagnostics, stabilizes paths relative to `cwd`, and renders rich labels/help with `ariadne`. Its generated
`EventKindSwitcher` also shows how warning filters can stay cheap and explicit.

Panda v2 should borrow the shape, not the full breadth. The CLI should feel small like Tailwind for CSS generation,
scriptable like ESLint, diagnosable like Prisma/Next, and structured like Rolldown at the compiler boundary.

## Production Gaps

### Diagnostics

The compiler already returns structured diagnostics, but the CLI mostly reports counts. Production output should render:

- severity,
- stable code,
- file path,
- line and column when available,
- message,
- optional labels/help,
- optional JSON/GitHub Actions formats.

Rolldown's model suggests keeping the compiler diagnostic as structured data first, then rendering it late for the
target surface. Panda should avoid reducing diagnostics to strings inside the compiler or driver. The CLI should own
final formatting, while the compiler should preserve enough data for rich terminal output and JSON.

Useful follow-up shape:

```ts
interface CliDiagnostic {
  code: string
  severity: 'info' | 'warning' | 'error'
  message: string
  file?: string
  location?: SourceRange
  labels?: Array<{ range: SourceRange; message?: string }>
  help?: string[]
}
```

This enables local debugging, CI annotations, and stable machine output.

### CI Contracts

Enterprise users need commands that can verify without writing:

```sh
panda codegen --check
panda cssgen --check
panda validate
panda inspect --json
```

These commands should have documented exit codes. A good starting contract:

- `0`: success,
- `1`: compilation or validation failed,
- `2`: config or usage error,
- `3`: internal/compiler host error.

Like ESLint, warning policy should be explicit rather than implicit. Consider:

```sh
--quiet
--max-warnings 0
--format human|json|github
```

Like Rolldown's event-kind filtering, Panda should eventually support enabling/disabling diagnostic classes by stable
code, not by matching text.

### Config Validation

`panda validate` should load the config, run config diagnostics, and optionally print JSON. It should be cheap enough to
run in CI before build steps, and it should explain unsupported v2 config features rather than failing later inside
codegen/cssgen.

### Watch Mode

Watch mode exists, but it should be hardened for real projects:

- clear startup summary,
- stable rebuild success/failure messages,
- configurable debounce/polling when needed,
- graceful shutdown,
- config reload messages that say what changed,
- no output loops from generated files.

Interactive restart keys are optional. The non-interactive watch contract matters more for enterprise users and build
systems.

### Observability

Large projects need a way to debug slow builds. The compiler exposes tracing hooks, but `cli_v2` does not surface them.
Add flags like:

```sh
--logfile panda.log
--verbose
--trace
--cpu-prof
```

The output should include phase timings: config load, scan, parse, codegen, css emit, and write time.

### Lifecycle and Migration

Do not port every legacy command first. The priority lifecycle commands are:

```sh
panda init
panda validate
panda debug
```

`init` should create a v2-ready config and optional PostCSS wiring. `debug` should print system/config/native binding
information suitable for bug reports. Migration support should focus on v2 config differences and unsupported legacy
features.

## Command Direction

### Core Commands

```sh
panda codegen [--watch] [--check] [--outdir <dir>] [--json]
panda cssgen [--watch] [--check] [--outfile <file>] [--splitting] [--minify] [--json]
panda inspect [--json]
panda validate [--json]
```

### Lifecycle Commands

```sh
panda init
panda debug [--json]
```

### Later Commands

Legacy parity commands such as `analyze`, `spec`, `studio`, `emit-pkg`, and MCP support can come after the core build
and CI flows are reliable. They should be ported only when the v2 compiler APIs can support them cleanly.

## Output Modes

Human output should be concise by default:

```txt
panda codegen
[ok] config loaded panda.config.ts
[ok] generated 24 files in styled-system (182ms)
```

Verbose output should show phases:

```txt
config  18ms
scan    24ms  156 files
parse   46ms  156 files, 3 diagnostics
emit    31ms  24 files
write   11ms
```

JSON output should be stable and versioned enough for CI:

```json
{
  "command": "codegen",
  "ok": true,
  "durationMs": 182,
  "exitCode": 0,
  "files": ["styled-system/css/css.mjs"],
  "missing": [],
  "stale": [],
  "diagnostics": []
}
```

## Phase 1 Contract

Phase 1 is implemented as a TypeScript host-layer upgrade in `packages/cli_v2`; it does not require Rust diagnostic
model changes. The common command result envelope is:

```ts
interface CliResult {
  ok: boolean
  command: string
  exitCode: 0 | 1 | 2 | 3
  durationMs: number
  diagnostics: Diagnostic[]
}
```

Command-specific data is added to that envelope. `codegen` reports `outdir`, `files`, `missing`, and `stale`. `cssgen`
reports `outfile`, `parsed`, `cssBytes`, `diagnosticCount`, `missing`, and `stale`. `inspect` reports its project
summary. `validate` reports `configPath`, `diagnosticCount`, and `errors`.

The Phase 1 exit-code contract is:

- `0`: command succeeded,
- `1`: compiler diagnostics with error severity, validation failure, or stale/missing `--check` output,
- `2`: config or usage error at the CLI host boundary,
- `3`: reserved for internal compiler-host errors.

`codegen --check` generates artifacts in memory with `driver.artifacts()` and compares the expected files under
`outdir` to disk. `cssgen --check` parses project files, then compares `driver.cssgen()` output or `driver.splitCss()`
files to disk. Neither mode writes files. Missing and stale paths are reported in human output and JSON.

## Implementation Phases

### Phase 1: Scriptable Core

- Added `validate`.
- Added `--check` to `codegen` and `cssgen`.
- Added diagnostic rendering for the existing compiler `Diagnostic` shape.
- Added `--json` output for `codegen`, `cssgen`, `inspect`, and `validate`.
- Documented exit codes and JSON result shape.

### Phase 2A: Shared Diagnostic Contract and Adapters

The diagnostic model should be shared by every host, not invented separately in `cli_v2`. Phase 2A should extend the
compiler-facing diagnostic contract and make sure each adapter preserves the same structured data.

The contract remains backward-compatible by adding optional fields only:

```ts
interface Diagnostic {
  code: string
  message: string
  severity: 'info' | 'warning' | 'error'
  span?: Span
  location?: SourceRange
  file?: string
  labels?: Array<{ message?: string; span?: Span; location?: SourceRange }>
  help?: string[]
  category?: string
}
```

Responsibilities:

- `pandacss_shared` owns the stable Rust shape and builder helpers. Phase 2A adds optional `file`, `category`,
  `labels`, and `help` fields.
- `@pandacss/compiler-shared` owns the TypeScript wire shape and mirrors the same optional fields.
- `@pandacss/compiler` and `@pandacss/compiler-wasm` mirror the optional fields across NAPI/wasm boundaries.
- `packages/vite` maps diagnostics to dev-server logging with file-aware messages without adopting CLI-specific flags.
- `packages/postcss_v2` maps warnings to PostCSS warnings and error-severity diagnostics to PostCSS errors.

Phase 2A should also normalize diagnostics at host boundaries:

- Preserve stable diagnostic codes and severity.
- Attach `file` when the host knows the source file.
- Stabilize file paths relative to `cwd` for user-facing output.
- Avoid duplicate parse diagnostics when the same issue appears in both parse and compile results.

### Phase 2B: CLI Diagnostic UX

After the shared contract is in place, `cli_v2` can add renderer and policy behavior on top of it.

Renderer modes:

```sh
panda cssgen --format human
panda cssgen --format pretty
panda cssgen --format json
panda cssgen --format github
```

`--json` remains an alias for `--format json`.

Behavior:

- `human`: compact `severity code file:line:column message`.
- `pretty`: Rolldown-style source snippet boxes when `file` + `location` are available, falling back to `human`.
- `json`: stable command result envelope with structured diagnostics.
- `github`: GitHub Actions annotations.
- `--quiet`: suppress warnings in human-like output.
- `--max-warnings <n>`: exit `1` when warnings exceed the threshold.

The CLI normalizes diagnostics before rendering:

- file paths are stabilized relative to `cwd`,
- parse diagnostics are attached to their source file,
- compile diagnostics duplicated from parse diagnostics are deduped in favor of the file-backed diagnostic,
- `--json` remains an alias for `--format json`.

Pretty rendering is a CLI concern. Vite and PostCSS should benefit from the richer diagnostic contract, but they should
adapt diagnostics to their own surfaces rather than sharing CLI formatting.

### Phase 3: Operational Hardening

- Add phase timings and `--verbose`.
- Add `--logfile`, `--trace`, `--trace-output`, and `--trace-file`.
- Improve watch startup/rebuild/shutdown output.
- Add focused tests for failed parse, no files matched, stale generated output, timing output, logfile teeing, tracing,
  and watch status messages.
- Defer `--cpu-prof` until there is a concrete v2 profiling consumer.

Phase 3 command results include a `timings` object when phases run:

```json
{
  "command": "cssgen",
  "durationMs": 42,
  "timings": {
    "config": 8,
    "parse": 12,
    "write": 18
  }
}
```

Verbose human output prints the same phases as text:

```txt
cssgen: timings
config: 8ms
parse: 12ms
write: 18ms
```

`--logfile <file>` tees human output to a file resolved from `cwd`; it does not change stdout/stderr behavior and does
not capture JSON output. `--trace` initializes compiler tracing before config load and flushes/shuts down tracing after
the command completes. Watch mode keeps tracing active until the returned `stop()` function runs.

Watch mode status messages are intentionally compact:

```txt
watch: ready (1 source dirs, 1 config files, debounce 50ms, outdir styled-system)
watch: rebuilding (1 source, 0 config)
watch: rebuilt 1 source events
watch: config reloaded
watch: stopped
```

### Phase 4: Lifecycle and Parity

- Add `init` for v2 config/PostCSS setup.
- Add `debug` for bug reports.
- Evaluate `analyze`, `spec`, `studio`, `emit-pkg`, and MCP after the core compiler APIs stabilize.

## Non-Goals

Do not make `cli_v2` a full clone of the legacy CLI immediately. A broad command surface with weak diagnostics would be
worse than a smaller command set with reliable CI behavior.

Do not hide Rust compiler limitations behind silent fallbacks. If v2 does not support a config feature, the CLI should
make that visible with an actionable diagnostic.

Do not require interactive behavior for enterprise workflows. Interactive prompts are useful for `init`, but build,
validate, and inspect commands must be fully scriptable.

## Related

- [Compiler diagnostics](./compiler-diagnostics.md)
- [Compiler lifecycle](./compiler-lifecycle.md)
- [Output and host layer](./output-and-host-layer.md)
- [Instrumentation](./instrumentation.md)
- [Config loading](./config-loading-design.md)
- [Rolldown `rolldown_error`](https://github.com/rolldown/rolldown/tree/main/crates/rolldown_error)
