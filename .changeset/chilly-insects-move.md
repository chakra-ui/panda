---
'@pandacss/astro': patch
'@pandacss/node': patch
---

Add `configPath` and `cwd` options in the `@pandacss/astro` integration just like in the `@pandacss/postcss`

This can be useful with Nx monorepos where the `panda.config.ts` is not in the root of the project.
