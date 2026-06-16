---
title: Beta CLI commands + tracing usability
status: draft
scope:
  - packages/cli
  - packages/compiler
---

# Beta CLI commands + tracing usability

## Goal

Close the v2 CLI command gap for the beta release and make the tracing system usable end-to-end. Three deliverables:

1. **Default `panda` command** (no subcommand) — the full build.
2. **`panda debug`** — diagnostic dump for bug reports.
3. **Tracing usability** — verify `--trace` works end-to-end and document it.

This is a beta-parity pass, not a full v1 CLI port. See [v2 CLI command gaps](./v2-cli-command-gaps.md) for the commands
that stay out of scope (`studio`, `analyze`, `ship`/`emit-pkg`).

## 1. Default command (`panda`) — done

v1 ran a bare `panda [files]` that called `generate()` — codegen + css in one pass — and was the command most users
typed. v2 split this into `panda codegen` and `panda cssgen`. The bare command is back so the common case is one word.

**Behavior:** `panda` runs codegen then cssgen on one driver pass (`runBuild` → `buildOnce`, composing the exported
`codegenOnce` + `cssgenOnce`). codegen runs first so `--clean` wipes the outdir before css is written. Diagnostics from
both passes are merged; one combined `panda: …` summary line replaces the per-command summaries.

**Flags:** `CommonFlags` plus `--outdir`, `--outfile`, `--splitting`, `--clean`, `--check`. `--outdir` relocates both
codegen output and the default CSS file (via `paths(outdir).styleFile`) so everything stays under one root. Watch reruns
the combined build per batch.

**citty routing (the tricky part).** citty resolves a subcommand from the first non-dash token, so a runnable root with
`subCommands` breaks two ways: `panda --outdir foo` reads `foo` as a command, and a matched subcommand still triggers
the root's `run` (double build). Fix: two separate command objects routed by `useDispatcher(rawArgs)` in `routing.ts` —
a runless dispatcher (subcommands + `--help`) and a standalone `build`. A leading non-dash token or `--help`/`-h` →
dispatcher; otherwise (no args, or leading flags) → standalone build. Consequence: **subcommands must come first**
(`panda codegen --cwd x`, not `panda --cwd x codegen`) — the standard convention, and citty can't do otherwise anyway.

**Deferred:** the v1 positional `[files]` include override — `createNodeDriver` has no per-invocation include option, so
the build uses the config `include`. Add when the driver supports an include override.

**Cross-platform:** routing is pure string logic (unit-tested, OS-independent); paths delegate to the compiler/driver.
TS CI runs on Linux (`ubuntu-latest`); Windows relies on this OS-agnostic design (no Windows TS CI job).

## 2. `panda debug` — done

v1 `debug [glob]` dumped config + per-file AST + per-file CSS under `--outdir` (default `styled-system/debug`), with
`--dry` / `--only-config`.

**What shipped** (`commands/debug.ts`, `runDebug`) — same flags (`--outdir`, `--dry`, `--only-config`). Output defaults
to `<styled-system>/debug`; `--outdir` overrides it and is used as-is (the literal target, not `<outdir>/debug`):

- `info.json` — platform, arch, node version, config path, source count. The "next info"-style header so one dump is
  enough for a bug report.
- `config.json` — the resolved config (`driver.config`, the `SerializedConfig`).
- `<file>.extract.json` — per-file extraction via `driver.compiler.extractFileSource(path, source)` (`calls`, `jsx`,
  `diagnostics`). Source list comes from `driver.scan()`, read with node `fs`.
- `styles.css` — the **whole-project** stylesheet (`driver.parseFiles()` then `driver.cssgen()`).

**v2 adaptations vs v1:**

- `extractFileSource` (the facade method) replaces v1's `extractDebug` — the latter is on the raw binding, not the
  `Compiler` facade.
- **Project-level CSS, not per-file.** v2 emits atomic CSS at the project level (atoms dedupe across files), so a
  per-file CSS slice isn't a meaningful unit. The dump carries one `styles.css`.
- Combined the v1 extraction dump (the "add back" reading) with a `next info`-style header, so both bug-report needs are
  covered by one command. This supersedes the Phase 4 `debug` definition in [cli.md](./cli.md).

## 3. Tracing usability

Plumbing already exists (see [instrumentation.md](./instrumentation.md)): Rust `tracing` spans, `pandacss_tracing`
subscriber, `PANDA_TRACE*` env, and CLI flags `--trace` / `--trace-output` / `--trace-file` wired through
`startCommandTracing` (`packages/cli/src/tracing.ts`) to native `startTracing/flushTracing/shutdownTracing`.

"Usable" is a validation + ergonomics + docs pass, not new infrastructure:

- **Verify end-to-end through the CLI** (not just the bench):
  `panda codegen --trace --trace-output chrome-json --trace-file .panda/traces/panda.json` produces a file that opens in
  Perfetto / `chrome://tracing`.
- **Confirm flag → native wiring** for every traceable command, and that watch keeps tracing alive until `stop()`.
- **Ergonomics:** sensible default trace file path when `--trace` is passed without `--trace-file`; `--verbose` prints
  trace start/stop status (already partly done).
- **Document** the flags + env in user-facing docs, not only in `instrumentation.md`.

## Out of scope

`studio`, `analyze`, `ship`/`emit-pkg`, lightningcss minify parity. Tracked in
[v2 CLI command gaps](./v2-cli-command-gaps.md).

## Related

- [CLI v2 Direction](./cli.md)
- [Instrumentation](./instrumentation.md)
- [v2 CLI command gaps](./v2-cli-command-gaps.md)
