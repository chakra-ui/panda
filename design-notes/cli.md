---
title: CLI v2 Direction
status: implemented
scope:
  - packages/cli
  - packages/compiler
  - packages/compiler-shared
  - packages/config
  - packages/vite
  - packages/postcss
---

# CLI v2 Direction

## Summary

`packages/cli` is the production host for the Rust compiler. The CLI surface is intentionally small and follows common
devtool conventions from Vite, Bun, ESLint, Prisma, and Next.js: clear lifecycle commands, predictable flags,
machine-readable output, diagnostics suitable for CI, and explicit debugging tools.

The primary command surface is:

```sh
panda init
panda dev
panda build
panda check
panda info
panda doctor
panda debug
```

Advanced commands remain available for lower-level workflows:

```sh
panda codegen
panda cssgen
panda buildinfo
```

Bare `panda` is a shortcut for the default build (`panda build`).

## Current command model

Commands are exported as `citty` command objects. They are not factories, and there is no `CommandContext`. Shared arg
builders compute the `cwd` default lazily with `process.cwd()` so help output stays accurate without threading context
through every command module.

The root dispatcher is runless. `cli-main.ts` routes:

- leading subcommands and help requests to the dispatcher,
- no args or leading flags to the standalone default build command.

This avoids citty's runnable-root double-run behavior while keeping bare `panda` useful.

## Flag schema boundary

citty owns parsing and help rendering. Parsed args then pass through `parseCliFlags(schema, args)`, which:

- normalizes kebab-case public flags to camelCase internal fields,
- validates values with Zod schemas from `packages/cli/src/schema.ts`,
- returns typed command flags without `args as BuildFlags` casts,
- prints concise invalid-option errors.

Example invalid flag output:

```txt
[error] Invalid command options
- --log-level: expected silent, error, warn, info, or debug (received "banana")
```

`schema.ts` is the single source for CLI flag schemas, inferred flag types, and command result/context types.

## Shared flags

Output verbosity is controlled by one flag:

```sh
--log-level silent|error|warn|info|debug
```

`--silent`, `--quiet`, and `--verbose` are intentionally removed from the public v2 surface. The log levels mean:

- `silent`: no human output
- `error`: error diagnostics only
- `warn`: error and warning diagnostics
- `info`: default summaries
- `debug`: timings and trace lifecycle messages

Shared operational flags are kebab-case:

```sh
--max-warnings
--watch-debounce
--trace-output
--trace-file
```

`--json` remains the machine-readable output switch and is equivalent to `--format json`.

## Diagnostics and CI contracts

The CLI renders structured compiler diagnostics late, at the host boundary. It preserves:

- severity,
- stable code,
- file path,
- line and column when available,
- message,
- optional help.

The supported render modes are:

```sh
--format human
--format pretty
--format json
--format github
```

`panda check`, `panda codegen --check`, and `panda cssgen --check` verify generated files without writing. Missing and
stale paths are reported in human output and JSON.

Exit codes:

- `0`: command succeeded,
- `1`: compiler diagnostics with error severity, doctor failure, or stale/missing `--check` output,
- `2`: reserved for config or usage errors at the CLI host boundary,
- `3`: reserved for internal compiler-host errors.

## Command result envelope

JSON output uses a common envelope:

```ts
interface CliResult {
  ok: boolean
  command: string
  exitCode: 0 | 1 | 2 | 3
  durationMs: number
  diagnostics: Diagnostic[]
}
```

Command-specific data is added to that envelope:

- `build`: `outdir`, `outfile`, `files`, `parsed`, `cssBytes`, `diagnosticCount`, `missing`, `stale`
- `codegen`: `outdir`, `files`, `missing`, `stale`
- `cssgen`: `outfile`, `parsed`, `cssBytes`, `diagnosticCount`, `missing`, `stale`
- `info`: project summary (`configPath`, source count, artifacts, conditions, token categories, utilities)
- `doctor`: `configPath`, `diagnosticCount`, `errors`
- `debug`: `outdir`, written files, source count
- `buildinfo`: artifact metadata counts and output path

## Observability

The CLI separates three levels of observability:

- `--log-level debug` for phase timings and trace lifecycle messages,
- `--trace` / `--trace-output` / `--trace-file` for Rust compiler tracing,
- future profile bundles for CPU/profiling artifacts.

Phase timings are included in JSON payloads when phases run and are printed in human output only at debug log level:

```txt
cssgen: timings
config: 8ms
parse: 12ms
write: 18ms
```

`--logfile <file>` tees human output to a file resolved from `cwd`. It does not capture JSON output.

## Watch mode

`panda dev` is the public watch command. It runs the full build in watch mode. Lower-level `codegen --watch` and
`cssgen --watch` remain available for advanced workflows.

Watch status messages are compact:

```txt
watch: ready (1 source dirs, 1 config files, debounce 50ms, outdir styled-system)
watch: rebuilding (1 source, 0 config)
watch: rebuilt 1 source events
watch: config reloaded
watch: stopped
```

Watch mode keeps tracing active until the returned `stop()` function runs.

## Lifecycle commands

- `panda init` scaffolds a v2-ready config and optional PostCSS wiring.
- `panda build` generates artifacts and CSS once.
- `panda dev` watches and rebuilds.
- `panda check` verifies generated output without writing.
- `panda info` prints project/compiler summary data.
- `panda doctor` checks config loading and compiler diagnostics.
- `panda debug` writes bug-report artifacts.

`panda inspect` and `panda validate` are removed. Use `panda info` and `panda doctor`.

## Non-goals

Do not make the v2 CLI a full clone of the legacy CLI immediately. A broad command surface with weak diagnostics is
worse than a smaller command set with reliable CI behavior.

Do not hide Rust compiler limitations behind silent fallbacks. If v2 does not support a config feature, the CLI should
make that visible with an actionable diagnostic.

Do not require interactive behavior for enterprise workflows. Interactive prompts are useful for `init`, but build,
doctor, info, and check commands must be scriptable.

## Related

- [Beta CLI commands + tracing usability](./beta-cli-commands.md)
- [Compiler diagnostics](./compiler-diagnostics.md)
- [Compiler lifecycle](./compiler-lifecycle.md)
- [Output and host layer](./output-and-host-layer.md)
- [Instrumentation](./instrumentation.md)
- [Config loading](./config-loading-design.md)
