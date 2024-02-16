---
'@pandacss/dev': patch
---

Fix issue in `defineParts` where it silently fails if a part not defined is used. It now errors with a helpful message
