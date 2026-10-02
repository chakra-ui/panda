---
'@pandacss/postcss': minor
'@pandacss/vite': minor
'@pandacss/rollup': minor
'@pandacss/webpack': minor
'@pandacss/bun': minor
'@pandacss/compiler': minor
'@pandacss/compiler-shared': minor
---

The bundler plugins (PostCSS, Vite, Rollup, webpack and Bun) no longer write a local `styled-system` folder when every
`importMap` entry points to an installed package. CSS is still generated, and `designSystem` apps keep their local
folder.
