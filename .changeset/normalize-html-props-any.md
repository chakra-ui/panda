---
'@pandacss/compiler': patch
---

`normalizeHTMLProps` from `styled-system/helpers` returns `Record<string, any>` again, as it did up to 2.1.1. Since 2.1.2 it returned `Record<string, unknown>`, so reading a prop off the result failed to type-check.
