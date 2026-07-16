---
'@pandacss/compiler-shared': patch
---

Accept multi-major and wildcard `panda` peer ranges when validating a design system. A design system declaring `"panda": "^2.0.0 || ^3.0.0"` is now compatible with consumers on either major, and the wildcard range `panda lib` writes by default (`*`) hydrates on any major instead of failing closed. Unresolved protocol ranges like `catalog:` still fail closed.
