---
'@pandacss/compiler': patch
---

Let bundlers drop the generated condition list and `normalizeHTMLProps` helper when nothing uses them, instead of
keeping them as side effects.
