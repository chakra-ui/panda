---
'@pandacss/core': patch
---

JSX: Always track the `<component>.Root` for recipe variant props. This is a generally resilient default and prevents
the need for manual jsx hints.
