---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/compiler-wasm': minor
'@pandacss/cli': minor
---

`panda lib --spec` now records the spec in `panda/lib.json` as `spec`, relative to the manifest like `preset` and
`buildInfo`. Tooling that reads the manifest can tell whether a package shipped one instead of trying the path.

A `--spec` path that package.json `files` would not publish is left out with a `design_system_spec_not_publishable`
warning, so the manifest never points at a file that did not ship.
