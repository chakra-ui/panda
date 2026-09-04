---
'@pandacss/compiler': minor
'@pandacss/transformer': minor
---

Source transforms now handle slot recipes.

- `tabs({ size: 'sm' })` on a config slot recipe becomes an object of class strings, one per slot.
- Inline `sva()` compiles even when variants style each slot differently.
- Defaults, compound variants and finite conditionals fold; dynamic and responsive values stay on the runtime.
- Fix transformed recipe classes ignoring `prefix` and `hash`.
- Fix boolean compound variants in inline `cva()` / `sva()` never matching.
- Add `transform_source` spans to `--profile` output.
