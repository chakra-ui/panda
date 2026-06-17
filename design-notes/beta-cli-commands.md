---
title: Beta CLI commands + tracing usability
status: implemented
scope:
  - packages/cli
  - packages/compiler
---

# Beta CLI commands + tracing usability

## Goal

Close the v2 CLI command gap for the beta release and make tracing usable end-to-end.

The beta CLI now exposes a small devtool-style surface:

```sh
panda init
panda dev
panda build
panda check
panda info
panda doctor
panda debug
```

Advanced commands remain available for focused workflows:

```sh
panda codegen
panda cssgen
panda buildinfo
```

`panda inspect` and `panda validate` were intentionally removed. Use `panda info` for project/compiler summaries and
`panda doctor` for setup and diagnostic health checks.

## Build lifecycle commands

The default `panda` command and `panda build` both run codegen then cssgen on one driver pass (`runBuild` →
`buildOnce`, composing `codegenOnce` + `cssgenOnce`). codegen runs first so `--clean` wipes the outdir before CSS is
written. Diagnostics from both passes are merged; one combined `panda: ...` summary line replaces the per-command
summaries.

`panda dev` is the watch-mode lifecycle command. It sets `watch: true` internally and hides `--watch` from help.

`panda check` is the read-only CI command. It sets `check: true` internally and hides write/watch-only flags from help.

`codegen` and `cssgen` remain advanced commands for generating only artifacts or only CSS.

## Command implementation

Commands are exported as `citty` command objects, not command factories. `CommandContext` was removed. Shared arg
builders in `packages/cli/src/args.ts` compute the `cwd` default lazily with `process.cwd()`.

The root dispatcher is intentionally runless. `cli-main.ts` routes leading subcommands to the dispatcher and leading
flags/no args to the standalone default build command. This avoids citty's runnable-root double-run behavior while
keeping bare `panda` as a build shortcut.

Flag parsing is a two-step boundary:

1. citty owns CLI parsing and help rendering.
2. `parseCliFlags(schema, args)` normalizes kebab-case flags and validates them with Zod schemas from
   `packages/cli/src/schema.ts`.

This keeps command runners typed without `args as BuildFlags` casts and gives invalid CLI values concise errors.

## Shared flags

Output verbosity is consolidated behind one flag:

```sh
--log-level silent|error|warn|info|debug
```

`--silent`, `--quiet`, and `--verbose` are not part of the v2 command surface. The mapping is:

- `silent`: no human output
- `error`: error diagnostics only
- `warn`: error and warning diagnostics
- `info`: default summaries
- `debug`: timings and trace lifecycle messages

Shared operational flags use kebab-case:

```sh
--max-warnings
--watch-debounce
--trace-output
--trace-file
```

## Tracing

Tracing is separate from log level. CLI flags `--trace`, `--trace-output`, and `--trace-file` are wired through
`startCommandTracing` (`packages/cli/src/tracing.ts`) to native `startTracing/flushTracing/shutdownTracing`.

Example:

```sh
panda build --trace --trace-output chrome-json --trace-file .panda/traces/panda.json
```

`--log-level debug` prints trace start/stop lifecycle messages. Watch mode keeps tracing active until the returned
`stop()` function runs.

## Debug command

`panda debug` writes a bug-report dump under `<styled-system>/debug` by default, or under the literal `--outdir` when
provided:

- `system-info.json` — platform, arch, node version, config path, source count
- `config.json` — resolved config
- `<file>.extract.json` — per-file extraction via `driver.compiler.extractFileSource(path, source)`
- `styles.css` — whole-project stylesheet after `driver.parseFiles()` + `driver.cssgen()`

v2 emits atomic CSS at the project level, so the dump carries one project stylesheet instead of per-file CSS slices.

## Out of scope

`studio`, `analyze`, `ship`/`emit-pkg`, and lightningcss minify parity remain outside the beta CLI surface. See
[v2 CLI command gaps](./v2-cli-command-gaps.md).

## Related

- [CLI v2 Direction](./cli.md)
- [Instrumentation](./instrumentation.md)
- [v2 CLI command gaps](./v2-cli-command-gaps.md)
