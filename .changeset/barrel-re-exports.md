---
'@pandacss/compiler': patch
---

Resolve tokens, style values, and recipes imported through `export * from` barrel files, so their styles are extracted
and folded like direct imports. Large `export { … } from` barrels are also much faster to process.

```ts
// components/index.ts
export * from './button'
export * from './tokens'

// app.tsx
import { button, brand } from './components'

button({ size: 'lg' }) // now folds to its class string
css({ color: brand }) // now extracts the `brand` color
```
