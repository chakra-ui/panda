# @pandacss/dev

## 0.13.1

### Patch Changes

- a5d7d514: Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type
  definition files. This is useful for projects that use `moduleResolution: node16` which requires explicit file
  extensions in imports/exports.

  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

- Updated dependencies [577dcb9d]
- Updated dependencies [d0fbc7cc]
  - @pandacss/studio@0.13.1
  - @pandacss/error@0.13.1
  - @pandacss/config@0.13.1
  - @pandacss/node@0.13.1
  - @pandacss/postcss@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/preset-panda@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Minor Changes

- 04b5fd6c: - Add support for minification in `cssgen` command.
  - Fix issue where `panda --minify` does not work.

### Patch Changes

- @pandacss/node@0.13.0
- @pandacss/studio@0.13.0
- @pandacss/postcss@0.13.0
- @pandacss/config@0.13.0
- @pandacss/error@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/preset-panda@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/node@0.12.2
- @pandacss/postcss@0.12.2
- @pandacss/studio@0.12.2
- @pandacss/config@0.12.2
- @pandacss/error@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/preset-panda@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/node@0.12.1
- @pandacss/postcss@0.12.1
- @pandacss/studio@0.12.1
- @pandacss/config@0.12.1
- @pandacss/error@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/preset-panda@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Minor Changes

- 75ba44de: Add the CLI interactive mode

### Patch Changes

- 7a041b16: Add `defineUtility` method
- 4c8c1715: Export types for all `define` helper functions
- Updated dependencies [4c8c1715]
- Updated dependencies [bf2ff391]
  - @pandacss/studio@0.12.0
  - @pandacss/node@0.12.0
  - @pandacss/config@0.12.0
  - @pandacss/postcss@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/error@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/preset-panda@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/studio@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/node@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/config@0.11.1
  - @pandacss/preset-panda@0.11.1
  - @pandacss/postcss@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- cde9702e: Add an optional `glob` argument that overrides the config.include on the `panda cssgen` CLI command.
- 164fbf27: Remove astro plugin entrypoint in favor of installing `@pandacss/astro` package
- Updated dependencies [dead08a2]
- Updated dependencies [cde9702e]
- Updated dependencies [5b95caf5]
  - @pandacss/config@0.11.0
  - @pandacss/node@0.11.0
  - @pandacss/types@0.11.0
  - @pandacss/studio@0.11.0
  - @pandacss/postcss@0.11.0
  - @pandacss/preset-panda@0.11.0
  - @pandacss/token-dictionary@0.11.0
  - @pandacss/error@0.11.0
  - @pandacss/logger@0.11.0
  - @pandacss/shared@0.11.0

## 0.10.0

### Minor Changes

- a669f4d5: Introduce new slot recipe features.

  Slot recipes are useful for styling composite or multi-part components easily.

  - `sva`: the slot recipe version of `cva`
  - `defineSlotRecipe`: the slot recipe version of `defineRecipe`

  **Definition**

  ```jsx
  import { sva } from 'styled-system/css'

  const button = sva({
    slots: ['label', 'icon'],
    base: {
      label: { color: 'red', textDecoration: 'underline' },
    },
    variants: {
      rounded: {
        true: {},
      },
      size: {
        sm: {
          label: { fontSize: 'sm' },
          icon: { fontSize: 'sm' },
        },
        lg: {
          label: { fontSize: 'lg' },
          icon: { fontSize: 'lg', color: 'pink' },
        },
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  })
  ```

  **Usage**

  ```jsx
  export function App() {
    const btnClass = button({ size: 'lg', rounded: true })

    return (
      <button>
        <p class={btnClass.label}> Label</p>
        <p class={btnClass.icon}> Icon</p>
      </button>
    )
  }
  ```

### Patch Changes

- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/studio@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/node@0.10.0
  - @pandacss/config@0.10.0
  - @pandacss/preset-panda@0.10.0
  - @pandacss/postcss@0.10.0
  - @pandacss/astro@0.10.0
  - @pandacss/error@0.10.0
  - @pandacss/logger@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
- Updated dependencies [f10e706a]
  - @pandacss/types@0.9.0
  - @pandacss/postcss@0.9.0
  - @pandacss/node@0.9.0
  - @pandacss/config@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/preset-panda@0.9.0
  - @pandacss/studio@0.9.0
  - @pandacss/astro@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- f7da0aea: Add `-w, --watch` flag on `panda cssgen`, `-o` shortcut for `--outfile` for both `panda cssgen` and
  `panda ship`
- Updated dependencies [5d1d376b]
- Updated dependencies [ac078416]
- Updated dependencies [e1f6318a]
- Updated dependencies [be0ad578]
- Updated dependencies [78612d7f]
  - @pandacss/node@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/config@0.8.0
  - @pandacss/studio@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/postcss@0.8.0
  - @pandacss/preset-panda@0.8.0
  - @pandacss/astro@0.8.0
  - @pandacss/error@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f4bb0576]
- Updated dependencies [f59154fb]
- Updated dependencies [d8ebaf2f]
- Updated dependencies [a9c189b7]
- Updated dependencies [4ff7ddea]
- Updated dependencies [1a05c4bb]
  - @pandacss/node@0.7.0
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/config@0.7.0
  - @pandacss/postcss@0.7.0
  - @pandacss/studio@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/preset-panda@0.7.0
  - @pandacss/astro@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 21f1326b: Fix issue where `--config` flag doesn't work for most commands.
- Updated dependencies [032c152a]
- Updated dependencies [239fe41a]
- Updated dependencies [76419e3e]
  - @pandacss/node@0.6.0
  - @pandacss/studio@0.6.0
  - @pandacss/postcss@0.6.0
  - @pandacss/config@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/astro@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/preset-panda@0.6.0
  - @pandacss/shared@0.6.0

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
