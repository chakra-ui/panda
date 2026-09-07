---
'@pandacss/dev': minor
---

Add a `defineConditions` helper so custom conditions get the same typed authoring experience as tokens, recipes, and the other config blocks.

```ts
import { defineConditions } from '@pandacss/dev'

export const conditions = defineConditions({
  hover: '&:is(:hover, [data-hover])',
})
```
