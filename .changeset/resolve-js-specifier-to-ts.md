---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Resolve a `.js` import specifier to its `.ts` or `.tsx` source (and `.mjs` to `.mts`, `.cjs` to `.cts`) when reading
values from another file, as TypeScript and bundlers do. Before, a value imported as `'./tokens.js'` or through a
package.json `imports` map ending in `.js` was silently dropped, so its CSS was never generated.
