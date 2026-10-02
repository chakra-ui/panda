# Color palette selection

`colorPalette` swaps a palette's tokens in through virtual `colors.colorPalette.*` vars. Two questions are kept apart:

- **Which names are palettes.** Every color group is a candidate: each prefix of a token's parent path (`red`,
  `red.solid`), plus the full path of a `DEFAULT` color (`red.solid.bg`). `include` / `exclude` filter these names. An
  included name keeps its ancestors (v1's prefix rule, so `include: ['red.*']` still offers `red`); an excluded name
  drops its descendants.
- **Which tokens a palette maps.** Always its whole subtree, flat steps and nested groups alike. `include: ['red']`
  gives `colorPalette.a3` and `colorPalette.solid.bg`.

v1 filtered tokens by their parent path instead, so `include: ['red']` lost nested tokens and `['red.*']` lost flat
ones, and no filter could shrink the palette union without breaking one of them.

Defaults match v1: with no filters every group is a palette. Large nested themes (hundreds of names) make the
`strictTokens` `ColorPaletteValue` union big enough for TS2590 on spread props; `exclude: ['*.*']` keeps only
top-level palettes and every virtual token.
