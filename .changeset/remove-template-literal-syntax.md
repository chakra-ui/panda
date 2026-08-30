---
'@pandacss/types': major
'@pandacss/compiler': major
'@pandacss/compiler-wasm': major
'@pandacss/cli': major
---

Remove the `syntax` config option and the `template-literal` authoring mode. Drop `syntax` from your config and the `--syntax` flag from `panda init`, and write styles with the object syntax: `css({ color: 'red' })` instead of `` css`color: red` ``.
