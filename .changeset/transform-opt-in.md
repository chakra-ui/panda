---
'@pandacss/vite': minor
'@pandacss/webpack': minor
'@pandacss/rollup': minor
---

Source transforms stay behind `transform: true`. Vite rebuilds its transformer after a compiler reload, so HMR doesn't
keep a stale rewriter. Rollup reports compiler diagnostics and fails the build on errors instead of emitting CSS quietly.
