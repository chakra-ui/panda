---
'@pandacss/generator': patch
---

- **Style Context**:
  - Improve `createStyleContext` error messages to include component name, slot, and recipe name when Provider is
    missing.
  - Fix TypeScript types for `withProvider` and `withContext` to include the `as` prop, matching the behavior of the
    `styled` factory.
