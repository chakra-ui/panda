---
'@pandacss/compiler': patch
---

Keep native CSS keywords assignable under `strictTokens` for properties whose token category is empty.

A property like `cursor` (no `cursor` tokens defined) now accepts `'pointer'`, `'grab'`, and other native
keywords instead of requiring the `[pointer]` escape hatch. The same applies to any utility pointing at an
unpopulated token category, such as `opacity` and `zIndex`.
