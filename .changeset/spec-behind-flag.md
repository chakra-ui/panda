---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/cli': minor
---

`panda codegen` no longer writes `styled-system/specs/design-system.json`. Pass `--spec` to get it. Nothing else in the
build reads the file, and on a config with a few hundred semantic tokens it was about half of codegen time.

`--spec` works on `codegen`, `build` and `lib`. Add a path to put it somewhere else: `panda codegen --spec=meta.json`.
`panda lib --spec` writes it beside `preset.mjs` so you can ship it with a design system.
