---
'@pandacss/compiler': patch
---

Stop reporting a literal color inside a token reference as a missing token. `{#000/64}` and `{rgb(0 0 0)/64}` already
resolve to a `color-mix()`; only real token paths are validated now.
