---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
'@pandacss/compiler-shared': patch
---

Add the `compiler.designSystem` namespace — `create`, `validate`, `load`, and
`resolveChain` for a design system's `panda.lib.json` manifest. The manifest
records a library's preset, build info, import paths, and parent design system so
a consumer adopts it with one `designSystem` field.

- `create` / `validate` — produce and schema-check a manifest.
- `load` — the consumer side: validate, then hydrate the library's pre-extracted
  styles, tree-shaken to the consumer's imports.
- `resolveChain` — the composition case: order a chain of parent design systems
  root-first, deduping shared ancestors and reporting cycles.
