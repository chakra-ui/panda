---
'@pandacss/config': patch
---

- Fix issue in token validation logic where token with additional properties like `description` is considered invalid.
- When `validation` is set to `error`, show all config errors at once instead of stopping at the first error.
