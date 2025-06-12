---
'@pandacss/generator': patch
'@pandacss/shared': patch
---

Reduce the size of the generated `Token` type by referencing category tokens.

**Before:**

```ts
export type Token = 'colors.green.400' | 'colors.red.400'

export type ColorToken = 'green.400' | 'red.400'
```

**After:**

```ts
export type Token = `colors.${ColorToken}`

export type ColorToken = 'green.400' | 'red.400'
```
