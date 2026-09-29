---
'@pandacss/compiler': patch
---

Follow `export * from` barrel files:

- Tokens, style values, and recipes imported through a barrel are extracted and folded like direct imports.
- Large `export { … } from` barrels process much faster.

```ts
// components/index.ts
export * from './button'
export * from './tokens'

// app.tsx
import { button, brand } from './components'

button({ size: 'lg' }) // folds to its class string
css({ color: brand }) // extracts the `brand` color
```
