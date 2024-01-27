---
'@pandacss/generator': patch
'@pandacss/shared': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add new `cssgen:prepare:reset` hook

> Called right before serializing the CSS reset to string, givig you a chance to tweak the raw style object
