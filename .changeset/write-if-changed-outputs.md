---
'@pandacss/cli': patch
'@pandacss/compiler': minor
'@pandacss/compiler-shared': minor
'@pandacss/compiler-wasm': minor
---

Skip rewriting generated files when the content is unchanged.

Watch mode no longer bumps mtimes or triggers extra reloads for no-op codegen and CSS writes. Compiler write APIs now
use object params consistently.
