---
'@pandacss/cli': major
---

Panda CSS v2 beta moves the compiler hot path to Rust on Oxc.

- Rust/Oxc extraction and CSS emission replace ts-morph + ts-evaluator
- CLI publishes as `@pandacss/cli` (`panda` / `pandacss` binaries unchanged)
- v1 stays on `latest`; v2 betas use `beta`

All `@pandacss/**` packages bump together on this major.
