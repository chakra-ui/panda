---
'@pandacss/eslint-plugin': minor
---

Add the `no-unsafe-token-fn-usage` lint rule, on in `recommended`. It flags style values like `'{colors.red.500}'` or
`token('colors.red.500')` where the token name `'red.500'` works, and only when the swap keeps your CSS the same.
