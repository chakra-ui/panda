---
'@pandacss/generator': patch
---

Fixes issue where `defaultProps` was not supported in `withRootProvider` across all framework implementations (React,
Preact, Vue, Solid)

```tsx
const RootProvider = withRootProvider(Component, {
  defaultProps: {
    className: 'root-provider',
    // other default props
  },
})
```
