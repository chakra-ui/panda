# Benchmark reports

Dated reports comparing Panda implementations (JS / Rust NAPI / Rust WASM) against the same fixtures.

## Conventions

- **Filename**: `YYYY-MM-DD-<topic>.mdx`. The date is when the numbers were captured, not when the doc was written.
- **Top frontmatter**: include `fixtures`, `hardware`, and any caveat metadata so a future reader can judge whether the
  numbers still apply.
- **TL;DR table up front** — headline ratios in the first screen.
- **Reproduce section at the end** — exact commands a contributor can paste to re-run on their machine.
- **Don't delete older reports.** They're history; if numbers stop applying, write a new dated report that references
  the old one.
- **Legacy npm baseline** — comparison harnesses must run the legacy JS side against published npm `@pandacss/*`
  packages, not local workspace sources. Keep v2-only packages local (`@pandacss/compiler`, `@pandacss/compiler-wasm`,
  `@pandacss/config-loader`) and avoid `--conditions source` for bench scripts.

## How these connect to the design notes

The design notes capture _why_ the architecture looks the way it does. Benchmarks capture _whether the architecture pays
off_. When a benchmark surfaces a surprise (worse than expected, or a regression), that's the trigger to update or add a
design note explaining the trade-off.

## Reports

- [2026-05-16 — extract-js-vs-rust](./2026-05-16-extract-js-vs-rust.mdx) — first comparison of `@pandacss/parser`
  (ts-morph) vs `@pandacss/compiler`'s `Extractor` (Oxc + NAPI). 15–37× speedup, plus a 2026-05-18 JSX-heavy direct
  extractor spot check showing 773×.
- [2026-05-17 — token-dictionary-js-vs-rust-design](./2026-05-17-token-dictionary-js-vs-rust-design.mdx) — design
  comparison and benchmark plan for moving token dictionary construction/middleware parity into Rust.
- [2026-05-18 — binding-boundary-instrumentation](./2026-05-18-binding-boundary-instrumentation.mdx) — release-mode
  boundary numbers with tracing disabled vs Chrome JSON trace output enabled.
- [2026-06-01 — generated-types-js-vs-rust](./2026-06-01-generated-types-js-vs-rust.mdx) — `tsc --extendedDiagnostics`
  comparison of the Rust codegen vs legacy generator type graph (both `.d.ts`, `skipLibCheck`). Rust wins everything:
  **−99% instantiations**, −82 to −92% `Types`, −21 to −25% memory — via an own `CssValue`-based csstype + a single
  merged `system.d.ts`. (Lesson: measure `.d.ts`, not `.ts` source.)
- [2026-06-02 — cli-codegen-js-vs-rust](./2026-06-02-cli-codegen-js-vs-rust.mdx) — end-to-end CLI wall time
  (`codegen` + `cssgen`) on `sandbox/cli-v2`: v2 Rust CLI **~7× faster** (codegen 7.0×, cssgen 7.1×, n=9). Startup-bound
  tiny-project number with honest caveats (not equal-work — v2 emits 26 files vs 142, jsx pass deferred); `cssgen` is the
  apples-to-apples row.
- [2026-06-04 — react-jsx-codegen-types](./2026-06-04-react-jsx-codegen-types.mdx) — `usage.tsx` coverage for the new
  React JSX codegen surface (`styled`, `StyledVariantProps`, `createRecipeContext`, `createSlotRecipeContext`). Rust JSX
  type-checks cleanly; simplification cut JSX instantiations by 14–32% from the first clean run. Legacy JSX rows are
  documented as non-comparable because legacy lacks the split-context APIs.
- [2026-06-08 — v2-vs-legacy-full-pipeline](./2026-06-08-v2-vs-legacy-full-pipeline.mdx) — first whole-pipeline
  (`parse → encode → emit`) comparison: perf **+** style-output parity **+** gaps. Emitter is **25–390× faster** and
  byte-identical on the core surface (atomic css, conditions, `!important`, recipes incl. compound/default variants,
  patterns, `token()`, color tokens). Remaining work is front-end (config-loader `data:`-URL crash on dynamic imports,
  `./`-glob → 0 files, no preset injection) plus emitter edge cases (gradients, color-mix fallback). Object-map utility
  class naming (B2) fixed 2026-06-08. Full write-up in `bench/V2_VS_LEGACY_REPORT.md`.
