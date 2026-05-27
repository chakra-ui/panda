# @pandacss/compiler

The Panda compiler engine (Rust/Oxc), exposed to Node through a thin NAPI binding.

This package is intentionally a skeleton during `OSS-2401`. It exports a no-op `compile()` function and falls back to
the same no-op shape when the native `.node` file has not been built yet.

The compiler logic belongs in `crates/*`; the NAPI crate should stay as a thin boundary.
