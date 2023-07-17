# @pandacss/core

## 0.7.0

### Patch Changes

- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/error@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- 12c900ee: Fix issue where unitless grid properties were converted to pixel values
- 5bd88c41: Fix JSX recipe extraction when multiple recipes were used on the same component, ex:

  ```tsx
  const ComponentWithMultipleRecipes = ({ variant }) => {
    return (
      <button className={cx(pinkRecipe({ variant }), greenRecipe({ variant }), blueRecipe({ variant }))}>Hello</button>
    )
  }
  ```

  Given a `panda.config.ts` with recipes each including a common `jsx` tag name, such as:

  ```ts
  recipes: {
      pinkRecipe: {
          name: 'pinkRecipe',
          jsx: ['ComponentWithMultipleRecipes'],
          base: { color: 'pink.100' },
          variants: {
              variant: {
              small: { fontSize: 'sm' },
              },
          },
      },
      greenRecipe: {
          name: 'greenRecipe',
          jsx: ['ComponentWithMultipleRecipes'],
          base: { color: 'green.100' },
          variants: {
              variant: {
              small: { fontSize: 'sm' },
              },
          },
      },
      blueRecipe: {
          name: 'blueRecipe',
          jsx: ['ComponentWithMultipleRecipes'],
          base: { color: 'blue.100' },
          variants: {
              variant: {
              small: { fontSize: 'sm' },
              },
          },
      },
  },
  ```

  Only the first matching recipe would be noticed and have its CSS generated, now this will properly generate the CSS
  for each of them

- ef1dd676: Fix issue where `staticCss` did not generate all variants in the array of `css` rules
- b50675ca: Refactor parser to support extracting `css` prop in JSX elements correctly.
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/error@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- f9247e52: Provide better error logs:

  - full stacktrace when using PANDA_DEBUG
  - specific CssSyntaxError to better spot the error

- 1ed239cd: Add feature where `config.staticCss.recipes` can now use [`*`] to generate all variants of a recipe.

  before:

  ```ts
  staticCss: {
    recipes: {
      button: [{ size: ['*'], shape: ['*'] }]
    }
  }
  ```

  now:

  ```ts
  staticCss: {
    recipes: {
      button: ['*']
    }
  }
  ```

- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/error@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/error@0.5.0
  - @pandacss/logger@0.5.0

## 0.4.0

### Minor Changes

- 5b344b9c: Add support for disabling shorthand props

  ```ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    // ...
    shorthands: false,
  })
  ```

### Patch Changes

- 2a1e9386: Fix issue where aspect ratio css property adds `px`
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/error@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/error@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/error@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/token-dictionary@0.3.0
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
  - @pandacss/types@0.0.2
  - @pandacss/error@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2
