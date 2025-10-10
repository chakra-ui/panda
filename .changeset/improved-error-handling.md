---
'@pandacss/dev': patch
'@pandacss/shared': patch
'@pandacss/generator': patch
'@pandacss/extractor': patch
'@pandacss/parser': patch
'@pandacss/token-dictionary': patch
---

Only log errors that are instances of `PandaError`, preventing test framework and other non-Panda errors from being
logged during development.
