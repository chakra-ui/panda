# @pandacss/astro-plugin-studio

## 0.34.0

### Patch Changes

- @pandacss/node@0.34.0

## 0.33.0

### Patch Changes

- Updated dependencies [1968da5]
  - @pandacss/node@0.33.0

## 0.32.1

### Patch Changes

- Updated dependencies [89ffb6b]
  - @pandacss/node@0.32.1

## 0.32.0

### Patch Changes

- Updated dependencies [de4d9ef]
  - @pandacss/node@0.32.0

## 0.31.0

### Patch Changes

- Updated dependencies [f0296249]
- Updated dependencies [2d69b340]
- Updated dependencies [ddeda8ac]
  - @pandacss/node@0.31.0

## 0.30.2

### Patch Changes

- @pandacss/node@0.30.2

## 0.30.1

### Patch Changes

- @pandacss/node@0.30.1

## 0.30.0

### Patch Changes

- d5977c24: - Add a `--logfile` flag to the `panda`, `panda codegen`, `panda cssgen` and `panda debug` commands.

  - Add a `logfile` option to the postcss plugin

  Logs will be streamed to the file specified by the `--logfile` flag or the `logfile` option. This is useful for
  debugging issues that occur during the build process.

  ```sh
  panda --logfile ./logs/panda.log
  ```

  ```js
  module.exports = {
    plugins: {
      "@pandacss/dev/postcss": {
        logfile: "./logs/panda.log",
      },
    },
  };
  ```

- Updated dependencies [05686b9d]
- Updated dependencies [ab32d1d7]
- Updated dependencies [d5977c24]
  - @pandacss/node@0.30.0

## 0.29.1

### Patch Changes

- Updated dependencies [a5c75607]
  - @pandacss/node@0.29.1

## 0.29.0

### Patch Changes

- Updated dependencies [a2fb5cc6]
  - @pandacss/node@0.29.0

## 0.28.0

### Patch Changes

- Updated dependencies [f58f6df2]
- Updated dependencies [f255342f]
  - @pandacss/node@0.28.0

## 0.27.3

### Patch Changes

- Updated dependencies [1ed4df77]
- Updated dependencies [39d10c79]
  - @pandacss/node@0.27.3

## 0.27.2

### Patch Changes

- Updated dependencies [bfa8b1ee]
  - @pandacss/node@0.27.2

## 0.27.1

### Patch Changes

- Updated dependencies [ee9341db]
  - @pandacss/node@0.27.1

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
  - @pandacss/node@0.27.0

## 0.26.2

### Patch Changes

- @pandacss/node@0.26.2

## 0.26.1

### Patch Changes

- @pandacss/node@0.26.1

## 0.26.0

### Patch Changes

- Updated dependencies [1bd7fbb7]
- Updated dependencies [1bd7fbb7]
  - @pandacss/node@0.26.0

## 0.25.0

### Patch Changes

- Updated dependencies [bc154358]
  - @pandacss/node@0.25.0

## 0.24.2

### Patch Changes

- @pandacss/node@0.24.2

## 0.24.1

### Patch Changes

- Updated dependencies [10e74428]
  - @pandacss/node@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [63b3f1f2]
  - @pandacss/node@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [1ea7459c]
- Updated dependencies [383b6d1b]
- Updated dependencies [840ed66b]
  - @pandacss/node@0.23.0

## 0.22.1

### Patch Changes

- @pandacss/node@0.22.1

## 0.22.0

### Patch Changes

- Updated dependencies [a2f6c2c8]
- Updated dependencies [11753fea]
  - @pandacss/node@0.22.0
