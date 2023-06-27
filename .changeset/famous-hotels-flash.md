---
'@pandacss/extractor': patch
---

Handle operation tokens in extractor. This means that values such as `1 / 2`, `3*5`, `2 **4`, `8- 1` will now properly
be extracted

Fix: https://github.com/chakra-ui/panda/issues/801
