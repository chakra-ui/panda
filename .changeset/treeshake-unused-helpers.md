---
'@pandacss/compiler': patch
---

Shrink generated styled-system output:

- Bundlers can drop the condition list and `normalizeHTMLProps` when nothing uses them, about 2.7 KB with the full
  preset.
