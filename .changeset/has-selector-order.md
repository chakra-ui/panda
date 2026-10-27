---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix `:has()` rules being reordered by the pseudo-classes inside them. For example, `&:has(> input:checked)` no longer overrides
`&:has(> input[aria-invalid=true])` just because `:checked` appears in its argument.
