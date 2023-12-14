---
'@pandacss/generator': patch
---

Fix a typing issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with property-based
conditionals

```ts
css({
  bg: '[#3B00B9]', // ✅ was okay
  _dark: {
    // ✅ was okay
    color: '[#3B00B9]',
  },

  // ❌ Not okay, will be fixed in this patch
  color: {
    _dark: '[#3B00B9]',
  },
})
```
