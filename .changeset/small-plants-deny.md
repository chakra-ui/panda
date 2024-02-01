---
'@pandacss/token-dictionary': patch
'@pandacss/generator': patch
'@pandacss/fixture': patch
'@pandacss/shared': patch
'@pandacss/studio': patch
'@pandacss/types': patch
'@pandacss/core': patch
'@pandacss/node': patch
---

Introduce 3 new hooks:

## `tokens:created`

This hook is called when the token engine has been created. You can use this hook to add your format token names and
variables.

> This is especially useful when migrating from other css-in-js libraries, like Stitches.

```ts
export default defineConfig({
  // ...
  hooks: {
    'tokens:created': ({ configure }) => {
      configure({
        formatTokenName: (path) => '$' + path.join('-'),
      })
    },
  },
})
```

## `utility:created`

This hook is called when the internal classname engine has been created. You can override the default `toHash` function
used when `config.hash` is set to `true`

```ts
export default defineConfig({
  // ...
  hooks: {
    'utility:created': ({ configure }) => {
      configure({
        toHash(paths, toHash) {
          const stringConds = paths.join(':')
          const splitConds = stringConds.split('_')
          const hashConds = splitConds.map(toHash)
          return hashConds.join('_')
        },
      })
    },
  },
})
```

## `codegen:prepare`

This hook is called right before writing the codegen files to disk. You can use this hook to tweak the codegen files

```ts
export default defineConfig({
  // ...
  hooks: {
    'codegen:prepare': ({ artifacts, changed }) => {
      // do something with the emitted js/d.ts files
    },
  },
})
```
