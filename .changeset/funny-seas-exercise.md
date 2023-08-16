---
'@pandacss/generator': patch
'@pandacss/shared': patch
---

Make the `cx` smarter by merging and deduplicating the styles passed in

Example:

```tsx
<h1 className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>Will result in "mx_10 pt_6"</h1>
```
