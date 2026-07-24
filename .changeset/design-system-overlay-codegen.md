---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/config': minor
---

With a single-level `designSystem`, `panda codegen` reuses the library's styled-system instead of copying it. Your app
only generates the delta (extra tokens, recipes, patterns). Missing library exports fail with
`design_system_export_missing` instead of a silent bundler error.

```ts
export default defineConfig({
  designSystem: '@acme/ds',
})
```
