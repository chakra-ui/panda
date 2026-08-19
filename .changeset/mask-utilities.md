---
'@pandacss/preset-base': minor
'@pandacss/types': patch
---

Add `maskBottomFrom`, `maskXFrom`, and `maskRadialFrom` so you can fade an edge or spotlight an image without writing `mask-image` gradients by hand. Raw `maskImage` still works as an escape hatch.

```ts
css({ overflow: 'auto', maskBottomFrom: '80%' })
css({ maskBottomFrom: '50%', maskRadialFrom: '35%', maskRadialAt: 'center' })
```
