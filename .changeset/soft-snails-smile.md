---
'@pandacss/parser': patch
'@pandacss/core': patch
---

Fix issue where `base` doesn't work within css function

```jsx
css({
  // This didn't work, but now it does
  base: { color: 'blue' },
})
```
