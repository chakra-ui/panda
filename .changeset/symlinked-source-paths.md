---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix watch mode ignoring changes when a file is reported through a symlink, such as a symlinked project folder or a pnpm
workspace package.
