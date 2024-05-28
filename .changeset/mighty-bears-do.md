---
'@pandacss/core': minor
'@pandacss/node': minor
'@pandacss/dev': minor
---

Improve monorepo setup DX by exposing some cli flags

### `panda init`

- Added new flag `--no-codegen` to skip codegen during initialization
- Added new flag `--outdir` to specify the output directory for generated files

### `panda emit-pkg`

- Added new `--base` flag to specify the base directory for the entrypoints in the generated `package.json#exports`
  field
