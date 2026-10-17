---
'@pandacss/compiler': patch
---

Fix `realpath` returning `\\?\`-prefixed paths on Windows, so resolved paths match the ones Node and bundlers use.
