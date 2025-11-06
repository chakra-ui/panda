---
'@pandacss/generator': patch
---

Fix TypeScript error when using `data-*` attributes in `defaultProps` for `createStyleContext` and JSX factory
functions.

```tsx
const TabsList = withContext(TabsPrimitive.List, 'list', {
  defaultProps: {
    'data-slot': 'tabs-list', // now works without type errors
  }
})
```
