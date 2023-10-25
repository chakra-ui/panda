---
'@pandacss/postcss': patch
'@pandacss/node': patch
---

Fix persistent error that causes CI builds to fail due to PostCSS plugin emitting artifacts in the middle of a build
process.
