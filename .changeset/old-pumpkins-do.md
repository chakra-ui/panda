---
'@pandacss/astro-plugin-studio': minor
'@pandacss/preset-open-props': minor
'@pandacss/token-dictionary': minor
'@pandacss/preset-atlaskit': minor
'@pandacss/is-valid-prop': minor
'@pandacss/preset-panda': minor
'@pandacss/preset-base': minor
'@pandacss/extractor': minor
'@pandacss/generator': minor
'@pandacss/fixture': minor
'@pandacss/postcss': minor
'@pandacss/config': minor
'@pandacss/logger': minor
'@pandacss/parser': minor
'@pandacss/shared': minor
'@pandacss/studio': minor
'@pandacss/error': minor
'@pandacss/types': minor
'@pandacss/core': minor
'@pandacss/node': minor
'@pandacss/dev': minor
---

Improve performance, mostly for the CSS generation by removing a lot of `postcss` usage (and plugins).

## Public changes:

- Introduce a new `config.lightningcss` option to use `lightningcss` (currently disabled by default) instead of
  `postcss`.
- Add a new `config.browserslist` option to configure the browserslist used by `lightningcss`.
- Add a `--lightningcss` flag to the `panda` and `panda cssgen` command to use `lightningcss` instead of `postcss` for
  this run.

## Internal changes:

- `markImportant` fn from JS instead of walking through postcss AST nodes
- use a fork of `stitches` `stringify` function instead of `postcss-css-in-js` to write the CSS string from a JS object
- only compute once `TokenDictionary` properties
- refactor `serializeStyle` to use the same code path as the rest of the pipeline with `StyleEncoder` / `StyleDecoder`
  and rename it to `transformStyles` to better convey what it does
