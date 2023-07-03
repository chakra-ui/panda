---
'@pandacss/generator': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add feature where `config.staticCss.recipes` can now use [`*`] to generate all variants of a recipe.

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
