---
'@pandacss/compiler': patch
---

Fix `outExtension: "mjs"` emitting `.d.mts` files that TypeScript's bundler resolver cannot find.

Clean codegen now writes `.d.ts` next to `.mjs`, so `import { css } from 'styled-system/css'` typechecks. Set
`forceImportExtension: true` if you still want `.d.mts`.
