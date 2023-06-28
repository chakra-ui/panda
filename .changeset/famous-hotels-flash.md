---
'@pandacss/extractor': patch
---

Fix issue where operation tokens did not get extracted.

This means that values such as `1 / 2`, `3*5`, `2 **4`, `8- 1` will now properly be extracted
