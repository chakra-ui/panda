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
  **−88 to −98% instantiations**, −66 to −88% `Types`, −13 to −16% memory. (Lesson: measure `.d.ts`, not `.ts` source.)
