---
'@pandacss/compiler-shared': patch
---

Fix design systems whose Panda peer range has a space after the operator, such as `>= 2.0.0`, failing the version check
for every consumer.
