---
'@pandacss/compiler': patch
'@pandacss/cli': patch
'@pandacss/config': patch
---

Fix `panda lib` / `panda buildinfo` writing `panda: "*"` when the design system has no `@pandacss/dev` peer. That range
couldn't hydrate (`manifest requires Panda *`). Both commands now fall back to the running Panda major (for example
`^2.0.0`). Pass `--panda` to set the range yourself.
