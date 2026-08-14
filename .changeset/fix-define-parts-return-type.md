---
'@pandacss/generator': patch
'@pandacss/dev': patch
---

Fix the return type of `defineParts` so it reflects the actual runtime output.

Calling the returned function now gives you an object typed with the part `selector`s as keys, and only for the parts you
actually pass in. Previously it was typed as a `Partial` record keyed by the original part names, which was wrong on both
counts.
