---
'@pandacss/core': patch
---

Fix an issue with recipes that lead to in-memory duplication the resulting CSS, which would increase the time taken to
output the CSS after each extraction in the same HMR session (by a few ms).
