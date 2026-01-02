---
'@pandacss/preset-base': patch
---

**Gradient Utilities**: Fixed `token()` and brace syntax not working in `bgGradient`, `bgLinear`, and `textGradient`
utilities.

Before this fix, using token references in gradient values would not expand correctly:

```jsx
// ❌ Before: token references were ignored
css({ bgGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' })
// Output: background-image: linear-gradient(var(--gradient-stops))

// ✅ After: token references are properly expanded
css({ bgGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' })
// Output: background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300))
```

Both `token()` function syntax and brace syntax `{...}` now work correctly in gradient utilities.
