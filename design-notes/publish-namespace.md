# Publish Namespace

## Summary

Rust crates use the `pandacss_*` prefix (e.g. `pandacss_extractor`, `pandacss_encoder`). Directory names match
(`crates/pandacss_extractor/`). The prefix avoids crates.io collisions and matches the rest of Panda's published surface
(`@pandacss/*` on npm). All crates are `publish = false` today — the prefix is in place ahead of any actual publish.

## Rust crates

```
crates/
  pandacss_config/
  pandacss_encoder/
  pandacss_extractor/
  pandacss_project/
  pandacss_recipes/
  pandacss_shared/
  pandacss_tokens/
  pandacss_utility/
```

Each has `[package] name = "pandacss_<x>"` and `publish = false`. The `pandacss_` prefix uses an underscore, not a
hyphen — this is the Rust crate-name convention and matches how the names appear in `use pandacss_extractor::...`
statements. crates.io accepts both forms, but the underscore variant means the package name and the Rust import path are
identical, no `package = "..."` aliasing needed.

The `pandacss_bench` crate (under `bench/`) follows the same prefix, even though it's a workspace member rather than a
library crate. Consistency for grep + workspace tooling.

## Binding crates (NAPI + WASM)

Both binding cdylibs keep load-bearing names that mirror their JS-side output filenames. These are deliberate exceptions
to the `pandacss_*` rule because the cdylib name flows through to the JS loader path.

- **`packages/compiler/crate/Cargo.toml`** — `[package] name = "compiler_napi"`. Produces `compiler.node` consumed by
  `@pandacss/compiler`. `packages/compiler/src/load-binary.ts` requires the file at that exact name.
- **`packages/compiler-wasm/crate/Cargo.toml`** — `[package] name = "compiler_wasm"`. wasm-pack produces
  `compiler_wasm_bg.wasm` + `compiler_wasm.js` under `pkg-node/` and `pkg-web/`, consumed by `@pandacss/compiler-wasm`. The
  TS wrapper imports from `../pkg-node/compiler_wasm.js`; renaming the crate would invalidate that path.

Neither cdylib publishes to crates.io. Both ship only via npm.

## NPM packages

- `@pandacss/compiler` — already namespaced. The per-platform native packages produced by `@napi-rs/cli` (darwin-arm64,
  linux-x64-gnu, win32-x64-msvc, …) should also be `@pandacss/compiler-<platform>`.
- `@pandacss/compiler-wasm` — single npm package shipping both Node and browser wasm bundles. No per-platform split
  needed (wasm is portable).

Set NAPI per-platform naming via `packageName` in the binding's `package.json` or `napi.binaryName` / `napi.npmClient`
settings. Don't let napi-rs default to an unscoped name — the default `@napi-rs/cli` behavior would publish unscoped
packages.

## When something needs to publish

For each `pandacss_*` crate, flip `publish = false` to true (or remove the line). No other rename needed — the package
name is already publish-ready. Run `cargo publish --dry-run` against the target crate first; the version is currently
`0.0.0` workspace-wide and would need bumping.

## Related

- [crate-layering](./crate-layering.md)
- [bindings](./bindings.md)
