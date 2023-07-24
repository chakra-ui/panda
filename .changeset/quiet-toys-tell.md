---
'@pandacss/language-server': patch
'@pandacss/extractor': patch
'@pandacss/parser': patch
'@pandacss/node': patch
---

Fix node evaluation in extractor process (can happen when using a BinaryExpression, simple CallExpression or conditions)
