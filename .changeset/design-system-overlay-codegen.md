---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/config': minor
---

Consuming a `designSystem` no longer regenerates a full copy of its recipes and patterns. With a single-level
`designSystem`, `panda codegen` re-exports the library's recipe, pattern, and jsx-component definitions from the library
package and emits only your own delta. For a library with many components that's the bulk of the tree; the small generic
runtime (`css`, `cx`, `helpers`, the jsx factory) is still generated locally.

When you declare a recipe or pattern the library already ships, your definition is merged over the library's
(`theme.extend` deep-merge) and Panda warns (`design_system_artifact_conflict`).

`panda lib` now also publishes the design system's styled-system subpath exports (`./css`, `./recipes`, `./patterns`,
`./jsx`, `./tokens`), so the overlay barrels resolve with no bundler aliases. Only categories the codegen emitted are
exported.

Nested design-system chains keep emitting the full local tree for now; only single-level consumers get the overlay.
