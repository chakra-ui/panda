---
'@pandacss/postcss': minor
'@pandacss/vite': minor
'@pandacss/rollup': minor
'@pandacss/webpack': minor
'@pandacss/bun': minor
---

Add `codegen: false` to bundler plugins so apps importing a shared styled-system can skip generating a local copy while
still generating CSS.
