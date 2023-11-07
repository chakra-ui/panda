---
'@pandacss/preset-base': patch
'@pandacss/studio': patch
---

Fix an issue with the `grid` pattern from @pandacss/preset-base (included by default), setting a minChildWidth wasn't
interpreted as a token value

Before:

```tsx
<div className={grid({ minChildWidth: '80px', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))

<div className={grid({ minChildWidth: '20', gap: 8 })} />
// ❌ grid-template-columns: repeat(auto-fit, minmax(20, 1fr))
//                                                  ^^^
```

After:

```tsx
<div className={grid({ minChildWidth: '80px', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))

<div className={grid({ minChildWidth: '20', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(var(--sizes-20, 20), 1fr))
//                                                  ^^^^^^^^^^^^^^^^^^^
```
