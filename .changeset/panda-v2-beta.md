---
'@pandacss/cli': major
---

Panda CSS v2 beta rewrites the compiler hot path in Rust on top of Oxc.

Highlights:

- Rust/Oxc extraction and CSS emission replace the `ts-morph` + `ts-evaluator` pipeline.
- CLI published as `@pandacss/cli` (the `panda` / `pandacss` binaries are unchanged).
- v1 (`1.x`) remains on the `latest` dist-tag; v2 betas publish under the `beta` dist-tag.

Because `@pandacss/**` packages are versioned together, this major bump applies to every published Panda package.
