---
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
---

Static extraction now folds calls to simple pure helper functions used inside `css()` and JSX style props — arrow functions, function declarations, and IIFEs, local or imported across files. `token()` comparisons inside these helpers now resolve correctly too.
