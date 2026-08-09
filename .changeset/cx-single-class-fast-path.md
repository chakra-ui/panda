---
'@pandacss/transformer': patch
---

Speed up transformed components that pass a `className` through. `cx` now returns a lone class string as-is
instead of re-tokenizing it, which is the common case for elements the transform folds past a spread.
