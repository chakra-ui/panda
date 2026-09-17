---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/cli': minor
---

The design system spec now says where each token came from. `--spec` gives every token a `source` index into a new
`sources.entries` list of the presets and configs that contributed.

This answers "is this token ours or the parent design system's" without reproducing Panda's merge order — useful when a
product package builds on a shared one.

```jsonc
"tokens": { "colors.accent": { "category": "colors", "source": 1 } },
"sources": {
  "entries": [{ "kind": "preset", "name": "@acme/foundations" }, { "kind": "config", "file": "panda.config.ts" }]
}
```
