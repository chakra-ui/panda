---
'@pandacss/preset-base': patch
'@pandacss/generator': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Fix issue where `animationName` property was not connected to `theme.keyframes`, as a result, no autocompletion was
available.
