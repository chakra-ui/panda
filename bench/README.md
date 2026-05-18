# Panda Rust Engine Benchmarks

This workspace holds benchmark scripts for the Rust/Oxc migration spike (`OSS-2400`).

The first benchmark measures the current TypeScript engine so future Rust work has a stable baseline.

## Commands

```sh
pnpm bench:rust-spike
pnpm --filter=./bench baseline -- --cwd sandbox/vite-ts --warm 5
```

## Current Targets

- `sandbox/vite-ts`: first baseline target because it is small, checked in, and exercises normal app extraction.
- `sandbox/next-js-app`: next target after the baseline script is stable.
- A generated large TSX fixture: add after the fixture corpus is selected.
- A source-heavy object-spread fixture: add after the type-checker audit identifies high-risk extraction patterns.

## Metrics

- Context creation time.
- Cold `ctx.parseFiles()` time.
- CSS generation time after parsing.
- Warm single-file `ctx.parseFile()` time.
- Number of files scanned and files with CSS.
- RSS and heap usage before and after each phase.

## Rules

- Benchmarks must not write tracked files.
- Baseline runs must identify the repo commit and target cwd.
- Rust benchmarks must compare against the same target and hardware as the TypeScript baseline.
