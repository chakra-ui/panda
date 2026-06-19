---
'@pandacss/compiler': patch
---

Trim surrounding whitespace before generating class names, so cssgen and runtime `css()` produce the same class for values like `'0 auto '`.
