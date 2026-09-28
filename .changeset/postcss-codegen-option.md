---
'@pandacss/postcss': minor
---

Add a `codegen` option to the PostCSS plugin. Set it to `false` to stop the plugin from writing the `styled-system`
folder when your styled system lives in another package (via `importMap`). CSS is still generated as usual.
