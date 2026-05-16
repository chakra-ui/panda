# Rust Design Notes

Architectural decisions for the Panda v2 Rust pipeline (`crates/*` and `packages/binding/crate`). Each doc captures
_why_ something is shaped the way it is, not how to use it — for usage, read the rustdoc.

These docs are point-in-time records. When you change the underlying design, update the doc in the same PR. Borrow
rolldown's [`meta/design/`](https://github.com/rolldown/rolldown/tree/main/meta/design) template (see
[`template.md`](./template.md)) for new entries.

## Index

### Architecture

- [Crate layering](./crate-layering.md) — Tier 1/2/3 dependency model and what lives in each tier.
- [Extraction pipeline](./extraction-pipeline.md) — single-parse flow from source to `ExtractUsage`, parse-error
  contract, fast paths.
- [Project lifecycle](./project-lifecycle.md) — `PandaProject` add / replace / remove semantics for watch mode.
- [Scope and boundaries](./scope-and-boundaries.md) — what's deliberately _not_ in the Rust pipeline.

### Subsystems

- [Literal evaluator](./literal-evaluator.md) — what folds vs what doesn't (the ts-evaluator parity surface).
- [Cross-file resolution](./cross-file-resolution.md) — `CrossFileResolver`, cache shape, cycle guard.
- [Atomic encoding](./atomic-encoding.md) — encoder walker, condition matcher, recipe decomposition.

### Boundary

- [NAPI boundary](./napi-boundary.md) — mirror types, `ExtractedArg` discriminated union, `Extractor` session.

### Performance & operations

- [Performance budget](./performance-budget.md) — `PERF(port)` markers, allocation choices, `FxHashMap` usage.
- [Publish namespace](./publish-namespace.md) — placeholder crate names + rename plan before publish.

## Migration plan vs design notes

These notes describe the _current_ architecture. The Rust/Oxc migration plan and phase-by-phase porting rules live
separately:

- `RUST_OXC_MIGRATION.md` — master plan, phase breakdown, hook semantics.
- `RUST_ENGINE_SPIKE.mdx` — OSS-2400 spike spec, comment markers, unsafe policy.

When a decision in those plans gets implemented, capture the durable form here and link back.
