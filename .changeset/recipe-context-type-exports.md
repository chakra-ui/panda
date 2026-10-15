---
'@pandacss/compiler': patch
---

Fix declaration emit for code built on the generated `jsx` helpers. Since 2.1.2, a library exporting a `withProvider` or
`withContext` component got the whole props type inlined in its `.d.ts`, under pnpm the build could fail with TS2742 or
TS2883, and wrapping `createSlotRecipeContext` or `createRecipeContext` could fail with TS4023. The recipe-context and
`is-valid-prop` modules export every type their declarations use again, as they did up to 2.1.1, so library declarations
reference them by name.
