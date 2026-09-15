---
'@pandacss/cli': patch
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/config': patch
'@pandacss/language-server': patch
'@pandacss/mcp': patch
'@pandacss/postcss': patch
'@pandacss/rollup': patch
'@pandacss/vite': patch
---

Keep the `node:` prefix on built-in imports in the published output. tsup was stripping it, so Deno refused to load
Panda's files directly with `Import "child_process" not a dependency`.
