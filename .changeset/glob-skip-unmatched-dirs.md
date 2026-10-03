---
'@pandacss/compiler': patch
---

File discovery no longer walks into directories that no `include` pattern can match. A `../*/src/*.ts` include in a pnpm
workspace no longer follows linked packages through `node_modules`, which could make a build hang.
