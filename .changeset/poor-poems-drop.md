---
'@pandacss/generator': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Feat: `config.staticCss` recipes can now just use [`*`] to generate all variants

before:

```ts
staticCss: {
  recipes: {
    button: [{ size: ['*'], shape: ['*'] }]
  }
}
```

now:

```ts
staticCss: {
  recipes: {
    button: ['*']
  }
}
```
