---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Add the `compiler.designSystem` namespace — `create`, `validate`, and `load` for
a design system's `panda.lib.json` manifest. The manifest records a library's
preset, build info, import paths, and parent design system so a consumer adopts
it with one `designSystem` field. `load` is the consumer side: it validates the
manifest and hydrates the library's pre-extracted styles, tree-shaken to the
consumer's imports.
