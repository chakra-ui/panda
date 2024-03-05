# @pandacss/preset-open-props

## 0.34.0

### Patch Changes

- Updated dependencies [d1516c8]
  - @pandacss/types@0.34.0

## 0.33.0

### Patch Changes

- Updated dependencies [cca50d5]
- Updated dependencies [fde37d8]
  - @pandacss/types@0.33.0

## 0.32.1

### Patch Changes

- Updated dependencies [a032375]
- Updated dependencies [89ffb6b]
  - @pandacss/types@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [60cace3]
- Updated dependencies [de4d9ef]
  - @pandacss/types@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [8f36f9af]
- Updated dependencies [a17fe387]
- Updated dependencies [2d69b340]
  - @pandacss/types@0.31.0

## 0.30.2

### Patch Changes

- Updated dependencies [6b829cab]
  - @pandacss/types@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/types@0.30.1

## 0.30.0

### Patch Changes

- Updated dependencies [74485ef1]
- Updated dependencies [ab32d1d7]
- Updated dependencies [d5977c24]
  - @pandacss/types@0.30.0

## 0.29.1

### Patch Changes

- @pandacss/types@0.29.1

## 0.29.0

### Patch Changes

- Updated dependencies [5fcdeb75]
- Updated dependencies [250b4d11]
- Updated dependencies [a2fb5cc6]
  - @pandacss/types@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [f58f6df2]
  - @pandacss/types@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
  - @pandacss/types@0.27.3

## 0.27.2

### Patch Changes

- @pandacss/types@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/types@0.27.1

## 0.27.0

### Minor Changes

- 84304901: Improve performance, mostly for the CSS generation by removing a lot of `postcss` usage (and plugins).

  ## Public changes:

  - Introduce a new `config.lightningcss` option to use `lightningcss` (currently disabled by default) instead of
    `postcss`.
  - Add a new `config.browserslist` option to configure the browserslist used by `lightningcss`.
  - Add a `--lightningcss` flag to the `panda` and `panda cssgen` command to use `lightningcss` instead of `postcss` for
    this run.

  ## Internal changes:

  - `markImportant` fn from JS instead of walking through postcss AST nodes
  - use a fork of `stitches` `stringify` function instead of `postcss-css-in-js` to write the CSS string from a JS
    object
  - only compute once `TokenDictionary` properties
  - refactor `serializeStyle` to use the same code path as the rest of the pipeline with `StyleEncoder` / `StyleDecoder`
    and rename it to `transformStyles` to better convey what it does

### Patch Changes

- Updated dependencies [84304901]
  - @pandacss/types@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/types@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/types@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [b5cf6ee6]
- Updated dependencies [58df7d74]
  - @pandacss/types@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [59fd291c]
  - @pandacss/types@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/types@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0

## 0.23.0

### Patch Changes

- @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
  - @pandacss/types@0.22.1

## 0.22.0

### Patch Changes

- 4634df0e: Fix conditional variables in border radii
- Updated dependencies [526c6e34]
  - @pandacss/types@0.22.0

## 0.21.0

### Patch Changes

- 05047584: Add Open Props preset
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/types@0.21.0
