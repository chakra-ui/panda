---
'@pandacss/compiler': patch
---

Fix runtime class names for multiline string values. Runtime `css()` collapses multiline whitespace the same way cssgen does, so selectors match.
