---
'@pandacss/compiler': patch
---

Fix runtime class names for multiline string values.

Runtime `css()` now collapses multiline whitespace the same way cssgen does, so values like `` margin: `1rem\n2rem` `` match the generated CSS selector.
