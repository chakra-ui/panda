# @pandacss/token-dictionary

## 0.14.0

### Minor Changes

- b1c31fdd: - Introduces deep nested `colorPalettes` for enhanced color management

  - Previous color palette structure was flat and less flexible, now `colorPalettes` can be organized hierarchically for
    improved organization

  **Example**: Define colors within categories, variants and states

  ```js
  const theme = {
    extend: {
      semanticTokens: {
        colors: {
          button: {
            dark: {
              value: 'navy',
            },
            light: {
              DEFAULT: {
                value: 'skyblue',
              },
              accent: {
                DEFAULT: {
                  value: 'cyan',
                },
                secondary: {
                  value: 'blue',
                },
              },
            },
          },
        },
      },
    },
  }
  ```

  You can now use the root `button` color palette and its values directly:

  ```tsx
  import { css } from '../styled-system/css'

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: 'button',
          color: 'colorPalette.light',
          backgroundColor: 'colorPalette.dark',
          _hover: {
            color: 'colorPalette.light.accent',
            background: 'colorPalette.light.accent.secondary',
          },
        })}
      >
        Root color palette
      </button>
    )
  }
  ```

  Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

  ```tsx
  import { css } from '../styled-system/css'

  export const App = () => {
    return (
      <button
        className={css({
          colorPalette: 'button.light.accent',
          color: 'colorPalette.secondary',
        })}
      >
        Nested color palette leaf
      </button>
    )
  }
  ```

### Patch Changes

- 9e799554: Fix issue where negative spacing tokens doesn't respect hash option
- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/shared@0.13.1
- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/shared@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/shared@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/shared@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/shared@0.11.0

## 0.10.0

### Patch Changes

- 9d4aa918: Fix issue where svg asset tokens are seen as invalid in the browser
- Updated dependencies [24e783b3]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/types@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [be0ad578]
  - @pandacss/types@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0

## 0.6.0

### Patch Changes

- @pandacss/types@0.6.0
- @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/shared@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/shared@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
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
  - @pandacss/types@0.0.2
  - @pandacss/shared@0.0.2
