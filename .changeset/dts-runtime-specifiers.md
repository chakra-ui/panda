---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `forceImportExtension` emitting declaration files that TypeScript rejects. Generated `.d.ts` re-exports now point at
the runtime module (`export * from './css.js'`) instead of the declaration file, which no longer fails `tsc` with
TS2846.

Also fix `jsx/index.d.ts` reporting a duplicate `UnstyledProps` export (TS2308) — the recipe context artifacts now share
the declaration in `types/jsx` instead of each redeclaring it.
