# @pandacss/cli

## 2.0.0-beta.0

### Major Changes

- 4f7e283: Panda CSS v2 — the compiler hot path is rewritten in Rust (Oxc-based engine) and shipped via the native
  `@pandacss/compiler` binding, with a `@pandacss/compiler-wasm` build for the browser. This is the first `2.0.0-beta`
  pre-release.

  Highlights:

  - Rust/Oxc extraction and CSS emission replacing the `ts-morph` + `ts-evaluator` pipeline.
  - CLI published as `@pandacss/cli` (the `panda` / `pandacss` binaries are unchanged).
  - v1 (`1.x`) remains on the `latest` dist-tag; v2 betas publish under the `beta` dist-tag.

  Since `@pandacss/**` is a fixed version group, this major bump applies to every published Panda package.

### Patch Changes

- Updated dependencies [b567ae6]
- Updated dependencies [8e66595]
- Updated dependencies [cc30235]
- Updated dependencies [939a3d9]
- Updated dependencies [742d649]
  - @pandacss/compiler@2.0.0-beta.0
  - @pandacss/compiler-shared@2.0.0-beta.0
  - @pandacss/config@2.0.0-beta.0
