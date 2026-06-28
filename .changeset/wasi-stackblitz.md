---
'@pandacss/compiler': patch
---

Ship a `wasm32-wasi` build of the compiler so Panda runs in WebContainer-based
environments like StackBlitz, where the native binary can't load. The loader
already falls back to `@pandacss/compiler-wasm32-wasi` when no native binding is
present.

The cdylib is now linked as a WASI reactor (it exports `_initialize`) so the
WebAssembly runtime is initialized before use — without it the module hangs on
load under the emnapi loader.
