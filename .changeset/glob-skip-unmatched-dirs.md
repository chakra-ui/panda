---
'@pandacss/compiler': patch
---

File discovery no longer walks into directories that no `include` pattern can match, and enters each real directory once
however many symlinks lead to it. In pnpm workspaces, `../*/src/*.ts` and `../**/src/*.ts` includes no longer hang
following linked packages, and each file is scanned once instead of once per link path.
