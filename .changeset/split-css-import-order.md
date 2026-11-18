---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fixed `panda cssgen --splitting` emitting an invalid `styles.css` that browsers partly ignore and Turbopack fails to parse. The recipe layer order now lives in `styles/layers.css`.
