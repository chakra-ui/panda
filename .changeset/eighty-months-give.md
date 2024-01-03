---
'@pandacss/shared': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being seen as a
truthy value
