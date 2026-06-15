# @pandacss/compiler

The native binding for the Panda CSS compiler engine. The hot path (source scanning, extraction, and CSS emission) is
implemented in Rust (Oxc-based) and exposed to Node through a thin [NAPI](https://napi.rs) boundary.

Platform-specific binaries are published as `@pandacss/compiler-<platform>` and resolved automatically. When no native
binary is available, the package falls back to a no-op shape so consuming tools can degrade gracefully.

This package is consumed by `@pandacss/cli` / `@pandacss/dev`; you typically don't install it directly.

## Documentation

Visit the [Panda CSS documentation](https://panda-css.com) to learn more.

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
