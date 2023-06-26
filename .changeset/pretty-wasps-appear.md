---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/types': patch
'@pandacss/node': patch
---

Fix issue where using a nested outdir like `src/styled-system` with a baseUrl like `./src` would result on parser NOT
matching imports like `import { container } from "styled-system/patterns";` cause it would expect the full path
`src/styled-system`
