---
'@pandacss/compiler': patch
---

Fix file paths on Windows starting with `\\?\`, so they match the paths Node and your bundler use.
