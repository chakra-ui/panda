---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
---

Remove the unused `designSystem.resolveChain` binding. Design-system chains are resolved by the config loader (`loadDesignSystemChain`), which walks the single parent link each manifest declares; the separate Rust `resolve_chain` primitive was never called on that path, so the duplicate ordering/cycle logic is gone.
