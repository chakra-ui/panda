---
'@pandacss/compiler': patch
'@pandacss/compiler-shared': patch
'@pandacss/compiler-wasm': patch
'@pandacss/config': patch
'@pandacss/cli': patch
'@pandacss/postcss': patch
---

- Keep nested design-system build info package-local, and safely re-extract source when build info is stale, malformed,
  or corrupt.
- Normalize workspace Panda ranges and warn when effective consumer class-name options differ from the library.
- Preserve recipe cascade order, compound variants, and runtime token references when hydrating design-system build
  info.
- Validate manifests before loading presets, and reconcile token ownership and class-name compatibility after config
  hooks.
- Make hydration diagnostics actionable and CI-correct, with reason-specific fallback errors and grouped token
  conflicts.
