---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/config': minor
---

Consuming a `designSystem` no longer regenerates a copy of its styled-system. With a single-level `designSystem`,
`panda codegen` re-exports the library's recipe, pattern, and jsx definitions from the library package and imports the
generic runtime (`css`, `cx`, `helpers`, conditions, the jsx factory) from it too, emitting only your own delta. A
consumer that adds tokens, recipes, or patterns ships almost no generated runtime.

The runtime is generated locally only where you diverge from the library: authoring `conditions`, `breakpoints`, or
`utilities` keeps the `css` runtime local, and a differing `prefix`, `hash`, `separator`, `jsxFramework`,
`jsxStyleProps`, or `syntax` keeps all of it local.

`panda lib` publishes the subpath exports the consumer imports (`./css`, `./css/*`, `./helpers`, `./recipes`,
`./patterns`, `./jsx`, `./tokens`), so everything resolves without bundler aliases; only emitted categories are
exported. A library whose `package.json` is missing a needed export fails with `design_system_export_missing` instead of
a silent bundler error.

Declaring a recipe or pattern the library already ships merges your definition over it (`theme.extend`) and warns
(`design_system_artifact_conflict`). Nested design-system chains still emit the full local tree.
