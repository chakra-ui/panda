# Publish Namespace

## Summary

Rust crates use the `pandacss_*` prefix (e.g. `pandacss_extractor`, `pandacss_encoder`). Directory names match
(`crates/pandacss_extractor/`). The prefix avoids crates.io collisions and matches the rest of Panda's published surface
(`@pandacss/*` on npm). All crates are `publish = false` today — the prefix is in place ahead of any actual publish.

## Rust crates

```
crates/
  pandacss_cache/         (placeholder)
  pandacss_config/        (placeholder)
  pandacss_emitter/       (placeholder)
  pandacss_encoder/
  pandacss_engine/        (placeholder)
  pandacss_extractor/
  pandacss_optimizer/     (placeholder)
  pandacss_project/
  pandacss_recipes/
  pandacss_tokens/
```

Each has `[package] name = "pandacss_<x>"` and `publish = false`. The `pandacss_` prefix uses an underscore, not a
hyphen — this is the Rust crate-name convention and matches how the names appear in `use pandacss_extractor::...`
statements. crates.io accepts both forms, but the underscore variant means the package name and the Rust import path are
identical, no `package = "..."` aliasing needed.

The `pandacss_bench` crate (under `bench/`) follows the same prefix, even though it's a workspace member rather than a
library crate. Consistency for grep + workspace tooling.

## NAPI crate

`packages/binding/crate/Cargo.toml` keeps `[package] name = "binding_napi"` — it's a cdylib, not a publishable library
crate, and the output `.node` artifact lives next to the `@pandacss/binding` npm package. The TS loader
(`packages/binding/src/load-binary.ts`) expects `binding.node`; changing the cdylib name would invalidate that path.
This is a deliberate exception to the `pandacss_*` rule.

## NPM packages

`@pandacss/binding` is already namespaced. The per-platform native packages produced by `@napi-rs/cli` (darwin-arm64,
linux-x64-gnu, win32-x64-msvc, …) should also be `@pandacss/binding-<platform>`.

Set via the napi config (`packageName` in the binding's `package.json` or `napi.binaryName` / `napi.npmClient`
settings). Don't let napi-rs default to an unscoped name — the default `@napi-rs/cli` behavior would publish unscoped
packages.

## When something needs to publish

For each `pandacss_*` crate, flip `publish = false` to true (or remove the line). No other rename needed — the package
name is already publish-ready. Run `cargo publish --dry-run` against the target crate first; the version is currently
`0.0.0` workspace-wide and would need bumping.

## Related

- [crate-layering](./crate-layering.md)
- [napi-boundary](./napi-boundary.md)
