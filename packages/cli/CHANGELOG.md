# @pandacss/dev

## 0.5.1

### Patch Changes

- 5b09ab3b: Add support for `--outfile` flag in the `cssgen` command.

  ```bash
  panda cssgen --outfile dist/styles.css
  ```

- f9247e52: Provide better error logs:

  - full stacktrace when using PANDA_DEBUG
  - specific CssSyntaxError to better spot the error

- Updated dependencies [773565c4]
- Updated dependencies [5b09ab3b]
- Updated dependencies [8c670d60]
- Updated dependencies [33198907]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
- Updated dependencies [e48b130a]
- Updated dependencies [1a2c0e2b]
  - @pandacss/studio@0.5.1
  - @pandacss/node@0.5.1
  - @pandacss/types@0.5.1
  - @pandacss/config@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/postcss@0.5.1
  - @pandacss/preset-panda@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/astro@0.5.1
  - @pandacss/error@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
- Updated dependencies [3a87cff8]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/preset-panda@0.5.0
  - @pandacss/studio@0.5.0
  - @pandacss/node@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/config@0.5.0
  - @pandacss/postcss@0.5.0
  - @pandacss/astro@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/logger@0.5.0

## 0.4.0

### Patch Changes

- 8991b1e4: - Experimental support for `.vue` files and better `.svelte` support
  - Fix issue where the `panda ship` command does not write to the correct path
- a48e5b00: Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```bash
  panda codegen --watch
  ```

- Updated dependencies [d00eb17c]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/studio@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/config@0.4.0
  - @pandacss/node@0.4.0
  - @pandacss/preset-panda@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/postcss@0.4.0
  - @pandacss/astro@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- c8bee958: Add support for config path in cli commands via the `--config` or `-c` flag.

  ```bash
  panda init --config ./pandacss.config.js
  ```

- Updated dependencies [24b78f7c]
- Updated dependencies [9822d79a]
- Updated dependencies [65d3423f]
  - @pandacss/postcss@0.3.2
  - @pandacss/config@0.3.2
  - @pandacss/studio@0.3.2
  - @pandacss/astro@0.3.2
  - @pandacss/node@0.3.2
  - @pandacss/error@0.3.2
  - @pandacss/logger@0.3.2
  - @pandacss/preset-panda@0.3.2
  - @pandacss/shared@0.3.2
  - @pandacss/token-dictionary@0.3.2
  - @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
- Updated dependencies [22ec328e]
  - @pandacss/astro@0.3.1
  - @pandacss/config@0.3.1
  - @pandacss/error@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/node@0.3.1
  - @pandacss/postcss@0.3.1
  - @pandacss/preset-panda@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/studio@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [b8ab0868]
- Updated dependencies [bd5c049b]
- Updated dependencies [6d81ee9e]
  - @pandacss/node@0.3.0
  - @pandacss/preset-panda@0.3.0
  - @pandacss/types@0.3.0
  - @pandacss/postcss@0.3.0
  - @pandacss/studio@0.3.0
  - @pandacss/config@0.3.0
  - @pandacss/token-dictionary@0.3.0
  - @pandacss/astro@0.3.0
  - @pandacss/error@0.3.0
  - @pandacss/logger@0.3.0
  - @pandacss/shared@0.3.0

## 0.0.2

### Patch Changes

- fb40fff2: Initial release of all packages

  - Internal AST parser for TS and TSX
  - Support for defining presets in config
  - Support for design tokens (core and semantic)
  - Add `outExtension` key to config to allow file extension options for generated javascript. `.js` or `.mjs`
  - Add `jsxElement` option to patterns, to allow specifying the jsx element rendered by the patterns.

- Updated dependencies [c308e8be]
- Updated dependencies [fb40fff2]
  - @pandacss/config@0.0.2
  - @pandacss/types@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/node@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2
