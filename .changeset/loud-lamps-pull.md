---
'@pandacss/token-dictionary': patch
'@pandacss/preset-atlaskit': patch
'@pandacss/is-valid-prop': patch
'@pandacss/preset-panda': patch
'@pandacss/preset-base': patch
'@pandacss/ts-plugin': patch
'@pandacss/extractor': patch
'@pandacss/generator': patch
'@pandacss/fixture': patch
'@pandacss/postcss': patch
'@pandacss/config': patch
'@pandacss/logger': patch
'@pandacss/parser': patch
'@pandacss/shared': patch
'@pandacss/studio': patch
'@pandacss/astro': patch
'@pandacss/error': patch
'@pandacss/types': patch
'@pandacss/core': patch
'@pandacss/node': patch
'@pandacss/dev': patch
---

## Public changes

> These changes are only relevant if you are directly using **other** Panda `@pandacss/xxx` packages than the
> `@pandacss/dev`.

Use predefined interfaces instead of relying on automatic TS type inference or type aliases. This should result in
snappier

This should fix issues with the generation of typescript declaration (`.d.ts`) files when using `@pandacss/xxx` packages
directly, such as:

```
src/config.ts(21,14): error TS2742: The inferred type of 'tokens' cannot be named without a reference to '../node_modules/@pandacss/types/src/shared'. This is likely not portable. A type annotation is necessa…
```

## Internal changes:

Use [`tsconfig.compilerOptions.customConditions`](https://www.typescriptlang.org/tsconfig#customConditions) to get live
type inference from our workspace packages without the need for the `dev` command running.

This allows editing any source file and seeing the result instantly or using cmd+click on any type will jump to the
source instead of dist/xxx.d.ts !

Each workspace package imports are automatically resolved from the sources, type-wise in the editor and runtime-wise
with [vite](in dev only = in this repo cause we use the tsconfig customConditions with development)

This relies on node custom conditions in package.json `exports`:
https://nodejs.org/api/packages.html#conditional-exports
