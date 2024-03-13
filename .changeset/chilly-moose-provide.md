---
'@pandacss/token-dictionary': patch
---

Fix negative `semanticTokens` generation

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  tokens: {
    spacing: {
      1: { value: '1rem' },
    },
  },
  semanticTokens: {
    spacing: {
      lg: { value: '{spacing.1}' },
    },
  },
})
```

Will now correctly generate the negative value:

```diff
"spacing.-1" => "calc(var(--spacing-1) * -1)",
- "spacing.-lg" => "{spacing.1}",
+ "spacing.-lg" => "calc(var(--spacing-lg) * -1)",
```
