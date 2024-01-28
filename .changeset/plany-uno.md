---
'@pandacss/preset-base': minor
---

Updated the default preset in Panda to use the new `defaultValues` feature.

To override the default values, consider using the `extend` pattern.

```js
defineConfig({
  patterns: {
    extend: {
      stack: {
        defaultValues: { gap: '20px' },
      },
    },
  },
})
```
