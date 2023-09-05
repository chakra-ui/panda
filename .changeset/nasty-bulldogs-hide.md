---
'@pandacss/generator': patch
---

Add missing types (`StyledComponents`, `RecipeConfig`, `PatternConfig` etc) to solve a TypeScript issue (The inferred
type of xxx cannot be named without a reference...) when generating declaration files in addition to using
`emitPackage: true`
