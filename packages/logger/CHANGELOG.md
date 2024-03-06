# @pandacss/logger

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

- Updated dependencies [74485ef1]
- Updated dependencies [ab32d1d7]
- Updated dependencies [d5977c24]
  - @pandacss/types@0.30.0

## 0.29.1

## 0.29.0

## 0.28.0

## 0.27.3

## 0.27.2

## 0.27.1

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

## 0.26.2

## 0.26.1

## 0.26.0

## 0.25.0

## 0.24.2

## 0.24.1

## 0.24.0

## 0.23.0

### Patch Changes

- bd552b1f: Log stacktrace on error instead of only logging the message

## 0.22.1

## 0.22.0

## 0.21.0

## 0.20.1

## 0.20.0

## 0.19.0

## 0.18.3

## 0.18.2

## 0.18.1

## 0.18.0

## 0.17.5

## 0.17.4

## 0.17.3

## 0.17.2

## 0.17.1

## 0.17.0

## 0.16.0

## 0.15.5

## 0.15.4

## 0.15.3

## 0.15.2

## 0.15.1

## 0.15.0

## 0.14.0

## 0.13.1

## 0.13.0

## 0.12.2

## 0.12.1

## 0.12.0

## 0.11.1

## 0.11.0

## 0.10.0

## 0.9.0

## 0.8.0

## 0.7.0

## 0.6.0

## 0.5.1

### Patch Changes

- f9247e52: Provide better error logs:

  - full stacktrace when using PANDA_DEBUG
  - specific CssSyntaxError to better spot the error

## 0.5.0

## 0.4.0

## 0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch

## 0.3.0

## 0.0.2

### Patch Changes

- fb40fff2: Initial release of all packages

  - Internal AST parser for TS and TSX
  - Support for defining presets in config
  - Support for design tokens (core and semantic)
  - Add `outExtension` key to config to allow file extension options for generated javascript. `.js` or `.mjs`
  - Add `jsxElement` option to patterns, to allow specifying the jsx element rendered by the patterns.
