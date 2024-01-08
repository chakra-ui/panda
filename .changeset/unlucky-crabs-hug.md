---
'@pandacss/parser': patch
'@pandacss/core': patch
---

Refactors the parser and import analysis logic. The goal is to ensure we can re-use the import logic in ESLint Plugin
and Node.js.
