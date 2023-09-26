---
'@pandacss/core': patch
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/types': patch
---

Add a new `config.importMap` option that allows you to specify a custom module specifier to import from instead of being
tied to the `outdir`

You can now do things like leverage the native package.json [`imports`](https://nodejs.org/api/packages.html#subpath-imports):

```ts
export default defineConfig({
  outdir: './outdir',
  importMap: {
    css: '#panda/styled-system/css',
    recipes: '#panda/styled-system/recipes',
    patterns: '#panda/styled-system/patterns',
    jsx: '#panda/styled-system/jsx',
  },
})
```

Or you could also make your outdir an actual package from your monorepo:

```ts
export default defineConfig({
  outdir: '../packages/styled-system',
  importMap: {
    css: '@monorepo/styled-system',
    recipes: '@monorepo/styled-system',
    patterns: '@monorepo/styled-system',
    jsx: '@monorepo/styled-system',
  },
})
```

Working with tsconfig paths aliases is easy:

```ts
export default defineConfig({
  outdir: 'styled-system',
  importMap: {
    css: 'styled-system/css',
    recipes: 'styled-system/recipes',
    patterns: 'styled-system/patterns',
    jsx: 'styled-system/jsx',
  },
})
```
