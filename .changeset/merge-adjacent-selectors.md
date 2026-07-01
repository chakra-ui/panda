---
'@pandacss/compiler': patch
---

Merge adjacent selectors that share the same declarations.

The v2 emitter now joins consecutive matching rules in atomic CSS and `globalCss`, matching the legacy merge-rules pass
and producing smaller CSS.
