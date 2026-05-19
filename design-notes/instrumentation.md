# Instrumentation

Status: implemented for native tracing bootstrap, explicit shutdown, and core span emission.

## Decision

Panda's Rust crates emit `tracing` spans from the hot path, while `pandacss_tracing` owns subscriber setup at the native
boundary. Core crates do not choose output formats.

This follows Rolldown's tracing/logging model: keep cheap spans in Rust code, enable output with env vars, and use
Chrome JSON when we need a timeline view. Their level guidance maps well here: build/session-level work uses `debug`,
and input-scaled work uses `trace`. See Rolldown's contributor docs:
<https://rolldown.rs/contrib-guide/tracing-logging>.

## Env

```sh
PANDA_TRACE=trace
PANDA_TRACE_OUTPUT=fmt
PANDA_TRACE_OUTPUT=chrome-json
PANDA_TRACE_FILE=.panda/traces/panda.json
```

Unknown output modes are ignored. `chrome-json` creates parent directories and writes a trace file that can be opened in
Perfetto or Chrome tracing.

## Lifecycle

Native tracing is process-global because `tracing-subscriber` installs a global subscriber. `pandacss_tracing` therefore
caches both the env-derived config and the install result. Repeated binding calls do not re-read env vars, reopen trace
files, or attempt to reinstall the subscriber.

The native binding exposes explicit controls for benchmarks and diagnostics:

```ts
startTracing({ filter: 'trace', output: 'chrome-json', file: '.panda/traces/panda.json' })
flushTracing()
shutdownTracing()
```

`flushTracing()` is best-effort and keeps the writer alive. `shutdownTracing()` finalizes Chrome JSON by dropping the
writer guard; benchmark harnesses should call it once at the end of the process. This mirrors the practical lesson from
`fastrace`: flushing must drain/finalize the collector, not just signal a background writer.

## Span Map

- `config_compile` wraps system/config construction.
- `token_dictionary_build` wraps token dictionary construction.
- `file_parse` wraps `Project::parse_file_inner`, including `path`, `source_len`, and `cache_hit`.
- `extraction` wraps Oxc extraction.
- `oxc_parse` wraps the parser call inside extraction.
- `encoding` wraps project and encoder atomic/recipe processing.
- `recipe_resolution` wraps inline and config recipe parsing/resolution.
- `boundary_encode` wraps Rust-to-JS serialization for NAPI and WASM outputs.

## WASM

WASM receives the same lightweight span calls through shared crates, but does not initialize `tracing-subscriber`.
Browser/Node WASM timing stays explicit in benchmark harnesses until we choose a browser-friendly tracing bridge. If we
add WASM trace export later, Rust should emit buffered events to JS and let JS decide whether to write JSON, print, or
forward them.

## Real Validation

The real boundary benchmark validates Chrome output, not just unit tests:

```sh
PANDA_TRACE=trace \
PANDA_TRACE_OUTPUT=chrome-json \
PANDA_TRACE_FILE=.panda/traces/binding-boundary.json \
pnpm --filter @pandacss/bench binding-boundary --files 10 --repeat 10 --warm 2
```

The traced run produced valid JSON with 847 entries and these span names:
`config_compile`, `config_from_user_config`, `recipe_resolution`, `token_dictionary_build`, `file_parse`, `extraction`,
`oxc_parse`, `encoding`, and `boundary_encode`.

## Enterprise Path

Do not build a custom tracing protocol. If enterprise export is needed, add an `otlp` output mode to `pandacss_tracing`
behind a feature flag and send spans through OpenTelemetry/OTLP from the subscriber layer.

## Benchmark Rule

Use release-mode numbers only when deciding whether a micro-optimization is worth doing. Debug traces are useful for
shape and span coverage, not performance decisions.
