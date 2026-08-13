# Panda Rust Engine Benchmarks

This workspace holds benchmark scripts for the Rust/Oxc migration spike (`OSS-2400`).

The first benchmark measures the current TypeScript engine so future Rust work has a stable baseline.

## Commands

```sh
pnpm bench:rust-spike
pnpm --filter=./bench baseline -- --cwd sandbox/vite-ts --warm 5
```

## Runtime SSR benchmark (`runtime-css`)

```sh
pnpm --filter @pandacss/compiler build:native   # once, so codegen can run
pnpm --filter=./bench runtime-css               # TILES=400 by default
```

Generates a styled-system from the **local build** and renders a shop page with
`react-dom/server`, measuring the styling runtime that ships to the app. Four
sections:

1. **Shop page** — a full tile page rendered three ways: plain elements (the
   React/`renderToString` floor), `css()` fn, and the `styled.x` factory, with
   each pattern's overhead relative to the floor.
2. **Scale** — `css` fn vs `styled` factory at 1 / 100 / 400 / 1000 tiles.
3. **Per-call styling cost** — single element, 50k renders, `css` / `styled` /
   `cva`, comparing **cached** (repeated styles) against **cold** (unique styles
   every render).
4. **Cache guard** — from the measured per-call numbers: `css()` on repeated
   styles must be much cheaper than on unique ones. A reference-only memo
   collapses the two, so inline `css({ … })` re-serializes every render; the run
   fails the check when cached is not at least 2x cheaper than cold.

Numbers track whatever the current compiler emits, so a runtime regression shows
up as the guard flipping or the ratios widening. To compare against v1, run the
same shapes under `@pandacss/dev@1.11.4` in a throwaway project.

## staticCss condition sweep (`static_css_conditions`)

```sh
cargo run -p pandacss_bench --bin static_css_conditions --release
cargo run -p pandacss_bench --bin static_css_conditions --release -- --iterations 5
```

Models the configs from discussions #3106 / #3256: a large `staticCss` matrix
whose conditions are container queries. Holds the rule count fixed and grows only
the container scale, so identical `cssBytes` across steps means the extra time is
pure overhead. Guards the condition-lookup cache in `pandacss_config::Theme` —
without it, emit cost scales with `rules x containers^2`.

See [`STATIC_CSS_CONDITIONS_REPORT.md`](./STATIC_CSS_CONDITIONS_REPORT.md) for the
measured before/after.

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
