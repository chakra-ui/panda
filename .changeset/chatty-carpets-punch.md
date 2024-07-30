---
'@pandacss/generator': minor
'@pandacss/types': minor
---

Remove `base` from `css` or pattern style objects. The `base` keyword is only supported in recipes or conditional
styles.

**Before**

```jsx
hstack({
  // ❌ doesn't work
  base: {
    background: 'red.400',
    p: '11',
  },
  display: 'flex',
  flexDirection: 'column',
})
```

**After**

```jsx
hstack({
  // ✅ works
  background: 'red.400',
  p: '11',
  display: 'flex',
  flexDirection: 'column',
})
```
