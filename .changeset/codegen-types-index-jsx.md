---
'@pandacss/compiler': patch
---

Re-export `styled-system/types/jsx` for every JSX framework.

Solid, Vue, Preact, and Qwik projects now get the same JSX type entry as React, avoiding TypeScript's "inferred type
cannot be named" errors.
