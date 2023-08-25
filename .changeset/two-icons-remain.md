---
'@pandacss/generator': patch
---

Fix bug in generated js code for atomic slot recipe produce where `splitVariantProps` didn't work without the first slot
key.
