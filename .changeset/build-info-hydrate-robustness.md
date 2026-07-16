---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
'@pandacss/config': patch
---

- Keep nested design-system build info package-local, and safely re-extract source when build info is stale, malformed,
  or corrupt.
- Normalize workspace Panda ranges and warn when effective consumer class-name options differ from the library.
- Preserve recipe cascade order, compound variants, and runtime token references when hydrating design-system build
  info.
