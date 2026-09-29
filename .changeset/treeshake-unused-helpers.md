---
'@pandacss/compiler': patch
---

Let bundlers drop the generated condition list and `normalizeHTMLProps` when nothing uses them. With a full preset, the
condition list alone is about 2.7 KB.
