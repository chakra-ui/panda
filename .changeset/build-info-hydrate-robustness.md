---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
'@pandacss/config': patch
'@pandacss/cli': patch
'@pandacss/postcss': patch
---

Harden design-system build-info hydration: keep nested packages local, fall back safely when build info is stale or corrupt, and surface clearer option-mismatch and token-ownership diagnostics.
