# @pandacss/generator

## 0.25.0

### Patch Changes

- 59fd291c: Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)
- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/core@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/is-valid-prop@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
- Updated dependencies [61ebf3d2]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/core@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/is-valid-prop@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- 10e74428: - Fix an issue with the `@pandacss/postcss` (and therefore `@pandacss/astro`) where the initial @layer CSS
  wasn't applied correctly
  - Fix an issue with `staticCss` where it was only generated when it was included in the config (we can generate it
    through the config recipes)
  - @pandacss/core@0.24.1
  - @pandacss/is-valid-prop@0.24.1
  - @pandacss/logger@0.24.1
  - @pandacss/shared@0.24.1
  - @pandacss/token-dictionary@0.24.1
  - @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- f6881022: Add `patterns` to `config.staticCss`

  ***

  Fix the special `[*]` rule which used to generate the same rule for every breakpoints, which is not what most people
  need (it's still possible by explicitly using `responsive: true`).

  ```ts
  const card = defineRecipe({
    className: 'card',
    base: { color: 'white' },
    variants: {
      size: {
        small: { fontSize: '14px' },
        large: { fontSize: '18px' },
      },
      visual: {
        primary: { backgroundColor: 'blue' },
        secondary: { backgroundColor: 'gray' },
      },
    },
  })

  export default defineConfig({
    // ...
    staticCss: {
      recipes: {
        card: ['*'], // this

        // was equivalent to:
        card: [
          // notice how `responsive: true` was implicitly added
          { size: ['*'], responsive: true },
          { visual: ['*'], responsive: true },
        ],

        //   will now correctly be equivalent to:
        card: [{ size: ['*'] }, { visual: ['*'] }],
      },
    },
  })
  ```

  Here's the diff in the generated CSS:

  ```diff
  @layer recipes {
    .card--size_small {
      font-size: 14px;
    }

    .card--size_large {
      font-size: 18px;
    }

    .card--visual_primary {
      background-color: blue;
    }

    .card--visual_secondary {
      background-color: gray;
    }

    @layer _base {
      .card {
        color: var(--colors-white);
      }
    }

  -  @media screen and (min-width: 40em) {
  -    -.sm\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.sm\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.sm\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.sm\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 48em) {
  -    -.md\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.md\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.md\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.md\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 64em) {
  -    -.lg\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.lg\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.lg\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.lg\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 80em) {
  -    -.xl\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.xl\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.xl\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.xl\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }

  -  @media screen and (min-width: 96em) {
  -    -.\32xl\:card--size_small {
  -      -font-size: 14px;
  -    -}
  -    -.\32xl\:card--size_large {
  -      -font-size: 18px;
  -    -}
  -    -.\32xl\:card--visual_primary {
  -      -background-color: blue;
  -    -}
  -    -.\32xl\:card--visual_secondary {
  -      -background-color: gray;
  -    -}
  -  }
  }
  ```

- Updated dependencies [63b3f1f2]
- Updated dependencies [f6881022]
  - @pandacss/core@0.24.0
  - @pandacss/types@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/is-valid-prop@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- d30b1737: Fix issue where style props wouldn't be properly passed when using `config.jsxStyleProps` set to `minimal`
  or `none` with JSX patterns (`Box`, `Stack`, `Flex`, etc.)
- a3b6ed5f: Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal
  parsing when not using `config.syntax` set to "template-literal"
- 840ed66b: Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Updated dependencies [1ea7459c]
- Updated dependencies [80ada336]
- Updated dependencies [bd552b1f]
- Updated dependencies [840ed66b]
  - @pandacss/core@0.23.0
  - @pandacss/logger@0.23.0
  - @pandacss/is-valid-prop@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

- 8f4ce97c: Fix `slotRecipes` typings,
  [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added to `config.recipes`
  weren't added to `config.slotRecipes`
- 647f05c9: Fix a typing issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with property-based
  conditionals

  ```ts
  css({
    bg: '[#3B00B9]', // ✅ was okay
    _dark: {
      // ✅ was okay
      color: '[#3B00B9]',
    },

    // ❌ Not okay, will be fixed in this patch
    color: {
      _dark: '[#3B00B9]',
    },
  })
  ```

- 647f05c9: Fix a CSS generation issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with `!` or
  `!important`

  ```ts
  css({
    borderWidth: '[2px!]',
    width: '[2px !important]',
  })
  ```

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/core@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/is-valid-prop@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Minor Changes

- e83afef0: Update csstype to support newer css features

### Patch Changes

- 8db47ec6: Fix issue where array syntax did not generate reponsive values in mapped pattern properties
- 9c0d3f8f: Fix regression where `styled-system/jsx/index` had the wrong exports
- c95c40bd: Fix issue where `children` does not work in styled factory's `defaultProps` in React, Preact and Qwik
- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
- Updated dependencies [11753fea]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/core@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/is-valid-prop@0.22.0
  - @pandacss/logger@0.22.0

## 0.21.0

### Minor Changes

- 26e6051a: Add an escape-hatch for arbitrary values when using `config.strictTokens`, by prefixing the value with `[`
  and suffixing with `]`, e.g. writing `[123px]` as a value will bypass the token validation.

  ```ts
  import { css } from '../styled-system/css'

  css({
    // @ts-expect-error TS will throw when using from strictTokens: true
    color: '#fff',
    // @ts-expect-error TS will throw when using from strictTokens: true
    width: '100px',

    // ✅ but this is now allowed:
    bgColor: '[rgb(51 155 240)]',
    fontSize: '[12px]',
  })
  ```

### Patch Changes

- 5b061615: Add a shortcut for the `config.importMap` option

  You can now also use a string to customize the base import path and keep the default entrypoints:

  ```json
  {
    "importMap": "@scope/styled-system"
  }
  ```

  is the equivalent of:

  ```json
  {
    "importMap": {
      "css": "@scope/styled-system/css",
      "recipes": "@scope/styled-system/recipes",
      "patterns": "@scope/styled-system/patterns",
      "jsx": "@scope/styled-system/jsx"
    }
  }
  ```

- d81dcbe6: - Fix an issue where recipe variants that clash with utility shorthand don't get generated due to the
  normalization that happens internally.
  - Fix issue where Preact JSX types are not merging recipes correctly
- 105f74ce: Add a way to specify a recipe's `staticCss` options from inside a recipe config, e.g.:

  ```js
  import { defineRecipe } from '@pandacss/dev'

  const card = defineRecipe({
    className: 'card',
    base: { color: 'white' },
    variants: {
      size: {
        small: { fontSize: '14px' },
        large: { fontSize: '18px' },
      },
    },
    staticCss: [{ size: ['*'] }],
  })
  ```

  would be the equivalent of defining it inside the main config:

  ```js
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    // ...
    staticCss: {
      recipes: {
        card: {
          size: ['*'],
        },
      },
    },
  })
  ```

- 052283c2: Fix vue `styled` factory internal class merging, for example:

  ```vue
  <script setup>
  import { styled } from '../styled-system/jsx'

  const StyledButton = styled('button', {
    base: {
      bgColor: 'red.300',
    },
  })
  </script>
  <template>
    <StyledButton id="test" class="test">
      <slot></slot>
    </StyledButton>
  </template>
  ```

  Will now correctly include the `test` class in the final output.

- Updated dependencies [788aaba3]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [d81dcbe6]
- Updated dependencies [105f74ce]
  - @pandacss/core@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/is-valid-prop@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/core@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/is-valid-prop@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- e4fdc64a: Fix issue where conditional recipe variant doesn't work as expected
- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
- Updated dependencies [4ba982f3]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/core@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/is-valid-prop@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 61831040: Fix issue where typescript error is shown in recipes when `exactOptionalPropertyTypes` is set.

  > To learn more about this issue, see [this issue](https://github.com/chakra-ui/panda/issues/1688)

- 92a7fbe5: Fix issue in preflight where monospace fallback pointed to the wrong variable
- 89f86923: Fix issue where css variables were not supported in layer styles and text styles types.
- 402afbee: Improves the `config.strictTokens` type-safety by allowing CSS predefined values (like 'flex' or 'block' for
  the property 'display') and throwing when using anything else than those, if no theme tokens was found on that
  property.

  Before:

  ```ts
  // config.strictTokens = true
  css({ display: 'flex' }) // OK, didn't throw
  css({ display: 'block' }) // OK, didn't throw
  css({ display: 'abc' }) // ❌ didn't throw even though 'abc' is not a valid value for 'display'
  ```

  Now:

  ```ts
  // config.strictTokens = true
  css({ display: 'flex' }) // OK, didn't throw
  css({ display: 'block' }) // OK, didn't throw
  css({ display: 'abc' }) // ✅ will throw since 'abc' is not a valid value for 'display'
  ```

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
- Updated dependencies [9f5711f9]
  - @pandacss/types@0.19.0
  - @pandacss/core@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/is-valid-prop@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- 78b940b2: Fix issue with `forceConsistentTypeExtension` where the `composition.d.mts` had an incorrect type import
  - @pandacss/core@0.18.3
  - @pandacss/is-valid-prop@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/core@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/is-valid-prop@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 43bfa510: Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax
  in semantic tokens.
- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
- Updated dependencies [8c76cd0f]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/core@0.18.1
  - @pandacss/is-valid-prop@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Minor Changes

- b7cb2073: Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

  ```tsx
  import { splitCssProps, styled } from '../styled-system/jsx'
  import type { HTMLStyledProps } from '../styled-system/types'

  function SplitComponent({ children, ...props }: HTMLStyledProps<'div'>) {
    const [cssProps, restProps] = splitCssProps(props)
    return (
      <styled.div {...restProps} className={css({ display: 'flex', height: '20', width: '20' }, cssProps)}>
        {children}
      </styled.div>
    )
  }

  // Usage

  function App() {
    return <SplitComponent margin="2">Click me</SplitComponent>
  }
  ```

### Patch Changes

- ba9e32fa: Fix issue in template literal mode where comma-separated selectors don't work when multiline
- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/core@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/is-valid-prop@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- 6718f81b: Fix issue where Solid.js styled factory fails with pattern styles includes a css variable (e.g. Divider)
- 3ce70c37: Fix issue where cva composition in styled components doens't work as expected.
- Updated dependencies [a6dfc944]
  - @pandacss/core@0.17.5
  - @pandacss/is-valid-prop@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/core@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/is-valid-prop@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/core@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/is-valid-prop@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/core@0.17.2
- @pandacss/is-valid-prop@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 296d62b1: Change `OmittedHTMLProps` to be empty when using `config.jsxStyleProps` as `minimal` or `none`

  Fixes https://github.com/chakra-ui/panda/issues/1549

- 42520626: Fix issue where conditions don't work in semantic tokens when using template literal syntax.
- 7b981422: Fix issue in reset styles where button does not inherit color style
- 9382e687: remove export types from jsx when no jsxFramework configuration
- 5ce359f6: Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM
- Updated dependencies [aea28c9f]
- Updated dependencies [5ce359f6]
  - @pandacss/core@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/is-valid-prop@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Minor Changes

- 12281ff8: Improve support for styled element composition. This ensures that you can compose two styled elements
  together and the styles will be merged correctly.

  ```jsx
  const Box = styled('div', {
    base: {
      background: 'red.light',
      color: 'white',
    },
  })

  const ExtendedBox = styled(Box, {
    base: { background: 'red.dark' },
  })

  // <ExtendedBox> will have a background of `red.dark` and a color of `white`
  ```

  **Limitation:** This feature does not allow compose mixed styled composition. A mixed styled composition happens when
  an element is created from a cva/inline cva, and another created from a config recipe.

  - CVA or Inline CVA + CVA or Inline CVA = ✅
  - Config Recipe + Config Recipe = ✅
  - CVA or Inline CVA + Config Recipe = ❌

  ```jsx
  import { button } from '../styled-system/recipes'

  const Button = styled('div', button)

  // ❌ This will throw an error
  const ExtendedButton = styled(Button, {
    base: { background: 'red.dark' },
  })
  ```

- fbf062c6: Added a new type to extract variants out of styled components

  ```tsx
  import { StyledVariantProps } from '../styled-system/jsx'

  const Button = styled('button', {
    base: { color: 'black' },
    variants: {
      state: {
        error: { color: 'red' },
        success: { color: 'green' },
      },
    },
  })

  type ButtonVariantProps = StyledVariantProps<typeof Button>
  //   ^ { state?: 'error' | 'success' | undefined }
  ```

### Patch Changes

- 93996aaf: Fix an issue with the `@layer tokens` CSS declarations when using `cssVarRoot` with multiple selectors, like
  `root, :host, ::backdrop`
- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [e73ea803]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/core@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/is-valid-prop@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Minor Changes

- 36252b1d: ## --minimal flag

  Adds a new `--minimal` flag for the CLI on the `panda cssgen` command to skip generating CSS for theme tokens,
  preflightkeyframes, static and global css

  Thich means that the generated CSS will only contain the CSS related to the styles found in the included files.

  > Note that you can use a `glob` to override the `config.include` option like this:
  > `panda cssgen "src/**/*.css" --minimal`

  This is useful when you want to split your CSS into multiple files, for example if you want to split by pages.

  Use it like this:

  ```bash
  panda cssgen "src/**/pages/*.css" --minimal --outfile dist/pages.css
  ```

  ***

  ## cssgen {type}

  In addition to the optional `glob` that you can already pass to override the config.include option, the `panda cssgen`
  command now accepts a new `{type}` argument to generate only a specific type of CSS:

  - preflight
  - tokens
  - static
  - global
  - keyframes

  > Note that this only works when passing an `--outfile`.

  You can use it like this:

  ```bash
  panda cssgen "static" --outfile dist/static.css
  ```

### Patch Changes

- 2b5cbf73: correct typings for Qwik components
- Updated dependencies [20f4e204]
  - @pandacss/core@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/is-valid-prop@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- d12aed2b: Fix issue where unused recipes and slot recipes doesn't get treeshaken properly
- 909fcbe8: - Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`
- 3d5971e5: - **Vue**: Fix issue where elements created from styled factory does not forward DOM attributes and events
  to the underlying element.
  - **Vue**: Fix regression in generated types
  - **Preact**: Fix regression in generated types
  - @pandacss/core@0.15.5
  - @pandacss/is-valid-prop@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
  - @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- bf0e6a30: Fix issues with class merging in the `styled` factory fn for Qwik, Solid and Vue.
- 69699ba4: Improved styled factory by adding a 3rd (optional) argument:

  ```ts
  interface FactoryOptions<TProps extends Dict> {
    dataAttr?: boolean
    defaultProps?: TProps
    shouldForwardProp?(prop: string, variantKeys: string[]): boolean
  }
  ```

  - Setting `dataAttr` to true will add a `data-recipe="{recipeName}"` attribute to the element with the recipe name.
    This is useful for testing and debugging.

  ```jsx
  import { styled } from '../styled-system/jsx'
  import { button } from '../styled-system/recipes'

  const Button = styled('button', button, { dataAttr: true })

  const App = () => (
    <Button variant="secondary" mt="10px">
      Button
    </Button>
  )
  // Will render something like <button data-recipe="button" class="btn btn--variant_purple mt_10px">Button</button>
  ```

  - `defaultProps` allows you to skip writing wrapper components just to set a few props. It also allows you to locally
    override the default variants or base styles of a recipe.

  ```jsx
  import { styled } from '../styled-system/jsx'
  import { button } from '../styled-system/recipes'

  const Button = styled('button', button, {
    defaultProps: {
      variant: 'secondary',
      px: '10px',
    },
  })

  const App = () => <Button>Button</Button>
  // Will render something like <button class="btn btn--variant_secondary px_10px">Button</button>
  ```

  - `shouldForwardProp` allows you to customize which props are forwarded to the underlying element. By default, all
    props except recipe variants and style props are forwarded.

  ```jsx
  import { styled } from '../styled-system/jsx'
  import { button } from '../styled-system/recipes'
  import { isCssProperty } from '../styled-system/jsx'
  import { motion, isValidMotionProp } from 'framer-motion'

  const StyledMotion = styled(
    motion.div,
    {},
    {
      shouldForwardProp: (prop, variantKeys) =>
        isValidMotionProp(prop) || (!variantKeys.includes(prop) && !isCssProperty(prop)),
    },
  )
  ```

  - @pandacss/types@0.15.4
  - @pandacss/core@0.15.4
  - @pandacss/is-valid-prop@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- d34c8b48: Fix issue where HMR does not work for Vue JSX factory and patterns
- 1ac2011b: Add a new `config.importMap` option that allows you to specify a custom module specifier to import from
  instead of being tied to the `outdir`

  You can now do things like leverage the native package.json
  [`imports`](https://nodejs.org/api/packages.html#subpath-imports):

  ```ts
  export default defineConfig({
    outdir: './outdir',
    importMap: {
      css: '#panda/styled-system/css',
      recipes: '#panda/styled-system/recipes',
      patterns: '#panda/styled-system/patterns',
      jsx: '#panda/styled-system/jsx',
    },
  })
  ```

  Or you could also make your outdir an actual package from your monorepo:

  ```ts
  export default defineConfig({
    outdir: '../packages/styled-system',
    importMap: {
      css: '@monorepo/styled-system',
      recipes: '@monorepo/styled-system',
      patterns: '@monorepo/styled-system',
      jsx: '@monorepo/styled-system',
    },
  })
  ```

  Working with tsconfig paths aliases is easy:

  ```ts
  export default defineConfig({
    outdir: 'styled-system',
    importMap: {
      css: 'styled-system/css',
      recipes: 'styled-system/recipes',
      patterns: 'styled-system/patterns',
      jsx: 'styled-system/jsx',
    },
  })
  ```

- 1eb31118: Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory,
  example below

  With this config recipe:

  ```ts file="panda.config.ts"
  const button = defineRecipe({
    className: 'btn',
    base: { color: 'green', fontSize: '16px' },
    variants: {
      size: { small: { fontSize: '14px' } },
    },
    compoundVariants: [{ size: 'small', css: { color: 'blue' } }],
  })
  ```

  This would previously not merge the `color` property overrides, but now it does:

  ```tsx file="example.tsx"
  import { styled } from '../styled-system/jsx'
  import { button } from '../styled-system/recipes'

  const Button = styled('button', button)

  function App() {
    return (
      <>
        <Button size="small" color="red.100">
          Click me
        </Button>
      </>
    )
  }
  ```

  - Before: `btn btn--size_small text_blue text_red.100`
  - After: `btn btn--size_small text_red.100`

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/core@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/is-valid-prop@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 6d15776c: When bundling the `outdir` in a library, you usually want to generate type declaration files (`d.ts`).
  Sometimes TS will complain about types not being exported.

  - Export all types from `{outdir}/types/index.d.ts`, this fixes errors looking like this:

  ```
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/system-types'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/csstype'. This is likely not portable. A type annotation is necessary.
  src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/conditions'. This is likely not portable. A type annotation is necessary.
  ```

  - Export generated recipe interfaces from `{outdir}/recipes/{recipeFn}.d.ts`, this fixes errors looking like this:

  ```
  src/ui/avatar.tsx (16:318) "AvatarRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/avatar.tsx".
  src/ui/card.tsx (2:164) "CardRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/card.tsx".
  src/ui/checkbox.tsx (19:310) "CheckboxRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/checkbox.tsx".
  ```

  - Export type `ComponentProps` from `{outdir}/types/jsx.d.ts`, this fixes errors looking like this:

  ```
   "ComponentProps" is not exported by "styled-system/types/jsx.d.ts", imported by "src/ui/form-control.tsx".
  ```

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property
- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/core@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/is-valid-prop@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 7e8bcb03: Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- 433f88cd: Fix issue in css reset where number input field spinner still show.
- 7499bbd2: Add the property `-moz-osx-font-smoothing: grayscale;` to the `reset.css` under the `html` selector.
- Updated dependencies [848936e0]
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/core@0.15.1
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/is-valid-prop@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 9f429d35: Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- 93d9ee7e: Refactor: Prefer `NativeElements` type for vue jsx elements
- 35793d85: Fix issue with cva when using compoundVariants and not passing any variants in the usage (ex: `button()`
  with `const button = cva({ ... })`)
- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [bc3b077d]
- Updated dependencies [39298609]
- Updated dependencies [dd47b6e6]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/core@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/is-valid-prop@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- bdd30d18: Fix issue where `pattern.raw(...)` did not share the same signature as `pattern(...)`
- bff17df2: Add each condition raw value information on hover using JSDoc annotation
- 6548f4f7: Add missing types (`StyledComponents`, `RecipeConfig`, `PatternConfig` etc) to solve a TypeScript issue (The
  inferred type of xxx cannot be named without a reference...) when generating declaration files in addition to using
  `emitPackage: true`
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 542d1ebc: Change the typings for the `css(...args)` function so that you can pass possibly undefined values to it.

  This is mostly intended for component props that have optional values like `cssProps?: SystemStyleObject` and would
  use it like `css({ ... }, cssProps)`

- 39b20797: Change the `css.raw` function signature to match the one from
  [`css()`](https://github.com/chakra-ui/panda/pull/1264), to allow passing multiple style objects that will be smartly
  merged.
- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
- Updated dependencies [623e321f]
- Updated dependencies [02161d41]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/core@0.14.0
  - @pandacss/is-valid-prop@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- a5d7d514: Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type
  definition files. This is useful for projects that use `moduleResolution: node16` which requires explicit file
  extensions in imports/exports.

  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

- 192d5e49: Fix issue where `cva` is undefined in preact styled factory
  - @pandacss/core@0.13.1
  - @pandacss/is-valid-prop@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- a9690110: Fix issue where `defineTextStyle` and `defineLayerStyle` return types are incompatible with `config.theme`
  type.
- 32ceac3f: Fix an issue with custom JSX components not finding their matching patterns
- Updated dependencies [04b5fd6c]
  - @pandacss/core@0.13.0
  - @pandacss/is-valid-prop@0.13.0
  - @pandacss/logger@0.13.0
  - @pandacss/shared@0.13.0
  - @pandacss/token-dictionary@0.13.0
  - @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- 6588c8e0: - Change the `css` function signature to allow passing multiple style objects that will be smartly merged.

  - Rename the `{cvaFn}.resolve` function to `{cva}.raw` for API consistency.
  - Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments
    passed in. This is to allow the `css` function to merge the styles correctly.

  ```tsx
  import { css } from '../styled-system/css'
  css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' }) // => mx_10 pt_6
  ```

  > ⚠️ This approach should be preferred for merging styles over the current `cx` function, which will be reverted to
  > its original classname concatenation behaviour.

  ```diff
  import { css, cx } from '../styled-system/css'

  const App = () => {
    return (
      <>
  -      <div className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>
  +      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
          Will result in `class="mx_10 pt_6"`
        </div>
      </>
    )
  }
  ```

  To design a component that supports style overrides, you can now provide the `css` prop as a style object, and it'll
  be merged correctly.

  ```tsx title="src/components/Button.tsx"
  import { css } from '../../styled-system/css'

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css({ display: 'flex', alignItem: 'center', color: 'black' }, cssProp)
    return <button className={className}>{children}</button>
  }
  ```

  Then you can use the `Button` component like this:

  ```tsx title="src/app/page.tsx"
  import { css } from '../../styled-system/css'
  import { Button, Thingy } from './Button'

  export default function Page() {
    return (
      <Button css={{ color: 'pink', _hover: { color: 'red' } }}>
        will result in `class="d_flex items_center text_pink hover:text_red"`
      </Button>
    )
  }
  ```

  ***

  You can use this approach as well with the new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects
  to be merged as expected in any situation.

  **Pattern Example:**

  ```tsx title="src/components/Button.tsx"
  import { hstack } from '../../styled-system/patterns'
  import { css, cva } from '../../styled-system/css'

  export const Button = ({ css: cssProp = {}, children }) => {
    // using the flex pattern
    const hstackProps = hstack.raw({
      border: '1px solid',
      _hover: { color: 'blue.400' },
    })

    // merging the styles
    const className = css(hstackProps, cssProp)

    return <button className={className}>{children}</button>
  }
  ```

  **CVA Example:**

  ```tsx title="src/components/Button.tsx"
  import { css, cva } from '../../styled-system/css'

  const buttonRecipe = cva({
    base: { display: 'flex', fontSize: 'lg' },
    variants: {
      variant: {
        primary: { color: 'white', backgroundColor: 'blue.500' },
      },
    },
  })

  export const Button = ({ css: cssProp = {}, children }) => {
    const className = css(
      // using the button recipe
      buttonRecipe.raw({ variant: 'primary' }),

      // adding style overrides (internal)
      { _hover: { color: 'blue.400' } },

      // adding style overrides (external)
      cssProp,
    )

    return <button className={className}>{props.children}</button>
  }
  ```

- 36fdff89: Fix bug in generated js code for atomic slot recipe produce where `splitVariantProps` didn't work without
  the first slot key.
  - @pandacss/core@0.12.2
  - @pandacss/is-valid-prop@0.12.2
  - @pandacss/logger@0.12.2
  - @pandacss/shared@0.12.2
  - @pandacss/token-dictionary@0.12.2
  - @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- 599fbc1a: Fix issue where `AnimationName` type was generated wrongly if keyframes were not resolved
  - @pandacss/core@0.12.1
  - @pandacss/is-valid-prop@0.12.1
  - @pandacss/logger@0.12.1
  - @pandacss/shared@0.12.1
  - @pandacss/token-dictionary@0.12.1
  - @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- a41515de: Fix issue where styled factory does not respect union prop types like `type Props = AProps | BProps`
- bf2ff391: Add `animationName` utility
- ad1518b8: fix failed styled component for solid-js when using recipe
  - @pandacss/core@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/is-valid-prop@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- c07e1beb: Make the `cx` smarter by merging and deduplicating the styles passed in

  Example:

  ```tsx
  <h1 className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>Will result in "mx_10 pt_6"</h1>
  ```

- dfb3f85f: Add missing svg props types
- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [dfb3f85f]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/is-valid-prop@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/core@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- 5b95caf5: Add a hook call when the final `styles.css` content has been generated, remove cyclic (from an unused hook)
  dependency
- 39b80b49: Fix an issue with the runtime className generation when using an utility that maps to multiple shorthands
- 1dc788bd: Fix issue where some style properties shows TS error when using `!important`
- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
  - @pandacss/core@0.11.0
  - @pandacss/token-dictionary@0.11.0
  - @pandacss/is-valid-prop@0.11.0
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

- 24e783b3: Reduce the overall `outdir` size, introduce the new config `jsxStyleProps` option to disable style props and
  further reduce it.

  `config.jsxStyleProps`:

  - When set to 'all', all style props are allowed.
  - When set to 'minimal', only the `css` prop is allowed.
  - When set to 'none', no style props are allowed and therefore the `jsxFactory` will not be usable as a component:
    - `<styled.div />` and `styled("div")` aren't valid
    - but the recipe usage is still valid `styled("div", { base: { color: "red.300" }, variants: { ...} })`

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- 386e5098: Update `RecipeVariantProps` to support slot recipes
- 6d4eaa68: Refactor code
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [2d2a42da]
- Updated dependencies [386e5098]
- Updated dependencies [6d4eaa68]
- Updated dependencies [a669f4d5]
  - @pandacss/is-valid-prop@0.10.0
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/core@0.10.0
  - @pandacss/logger@0.10.0

## 0.9.0

### Minor Changes

- c08de87f: ### Breaking

  - Renamed the `name` property of a config recipe to `className`. This is to ensure API consistency and express the
    intent of the property more clearly.

  ```diff
  export const buttonRecipe = defineRecipe({
  -  name: 'button',
  +  className: 'button',
    // ...
  })
  ```

  - Renamed the `jsx` property of a pattern to `jsxName`.

  ```diff
  const hstack = definePattern({
  -  jsx: 'HStack',
  +  jsxName: 'HStack',
    // ...
  })
  ```

  ### Feature

  Update the `jsx` property to be used for advanced tracking of custom pattern components.

  ```jsx
  import { Circle } from 'styled-system/jsx'
  const CustomCircle = ({ children, ...props }) => {
    return <Circle {...props}>{children}</Circle>
  }
  ```

  To track the `CustomCircle` component, you can now use the `jsx` property.

  ```js
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    patterns: {
      extend: {
        circle: {
          jsx: ['CustomCircle'],
        },
      },
    },
  })
  ```

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/types@0.9.0
  - @pandacss/core@0.9.0
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/is-valid-prop@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Minor Changes

- 9ddf258b: Introduce the new `{fn}.raw` method that allows for a super flexible usage and extraction :tada: :

  ```tsx
  <Button rootProps={css.raw({ bg: "red.400" })} />

  // recipe in storybook
  export const Funky: Story = {
  	args: button.raw({
  		visual: "funky",
  		shape: "circle",
  		size: "sm",
  	}),
  };

  // mixed with pattern
  const stackProps = {
    sm: stack.raw({ direction: "column" }),
    md: stack.raw({ direction: "row" })
  }

  stack(stackProps[props.size]))
  ```

### Patch Changes

- 3f1e7e32: Adds the `{recipe}.raw()` in generated runtime
- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- be0ad578: Fix parser issue with TS path mappings
- b75905d8: Improve generated react jsx types to remove legacy ref. This fixes type composition issues.
- 0520ba83: Refactor generated recipe js code
- 156b6bde: Fix issue where generated package json does not respect `outExtension` when `emitPackage` is `true`
- Updated dependencies [fb449016]
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/core@0.8.0
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/is-valid-prop@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

## 0.7.0

### Patch Changes

- a9c189b7: Fix issue where `splitVariantProps` in cva doesn't resolve the correct types
- Updated dependencies [f59154fb]
- Updated dependencies [a9c189b7]
  - @pandacss/shared@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/core@0.7.0
  - @pandacss/token-dictionary@0.7.0
  - @pandacss/is-valid-prop@0.7.0
  - @pandacss/logger@0.7.0

## 0.6.0

### Patch Changes

- cd912f35: Fix `definePattern` module overriden type, was missing an `extends` constraint which lead to a type error:

  ```
  styled-system/types/global.d.ts:14:58 - error TS2344: Type 'T' does not satisfy the constraint 'PatternProperties'.

  14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                                              ~

    styled-system/types/global.d.ts:14:33
      14   export function definePattern<T>(config: PatternConfig<T>): PatternConfig
                                         ~
      This type parameter might need an `extends PatternProperties` constraint.

  ```

- dc4e80f7: Export `isCssProperty` helper function from styled-system/jsx
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
          className: 'pinkRecipe',
          jsx: ['ComponentWithMultipleRecipes'],
          base: { color: 'pink.100' },
          variants: {
              variant: {
              small: { fontSize: 'sm' },
              },
          },
      },
      greenRecipe: {
          className: 'greenRecipe',
          jsx: ['ComponentWithMultipleRecipes'],
          base: { color: 'green.100' },
          variants: {
              variant: {
              small: { fontSize: 'sm' },
              },
          },
      },
      blueRecipe: {
          className: 'blueRecipe',
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
- Updated dependencies [12c900ee]
- Updated dependencies [5bd88c41]
- Updated dependencies [ef1dd676]
- Updated dependencies [b50675ca]
  - @pandacss/core@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/token-dictionary@0.6.0
  - @pandacss/is-valid-prop@0.6.0
  - @pandacss/logger@0.6.0
  - @pandacss/shared@0.6.0

## 0.5.1

### Patch Changes

- 53fb0708: Fix `config.staticCss` by filtering types on getPropertyKeys

  It used to throw because of them:

  ```bash
  <css input>:33:21: Missed semicolon
   ELIFECYCLE  Command failed with exit code 1.
  ```

  ```css
  @layer utilities {
      .m_type\:Tokens\[\"spacing\"\] {
          margin: type:Tokens["spacing"]
      }
  }
  ```

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

- 78ed6ed4: Fix issue where using a nested outdir like `src/styled-system` with a baseUrl like `./src` would result on
  parser NOT matching imports like `import { container } from "styled-system/patterns";` cause it would expect the full
  path `src/styled-system`
- b8f8c2a6: Fix reset.css (generated when config has `preflight: true`) import order, always place it first so that it
  can be easily overriden
- Updated dependencies [8c670d60]
- Updated dependencies [c0335cf4]
- Updated dependencies [762fd0c9]
- Updated dependencies [f9247e52]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/shared@0.5.1
  - @pandacss/logger@0.5.1
  - @pandacss/core@0.5.1
  - @pandacss/token-dictionary@0.5.1
  - @pandacss/is-valid-prop@0.5.1

## 0.5.0

### Minor Changes

- ead9eaa3: Add support for tagged template literal version.

  This features is pure css approach to writing styles, and can be a great way to migrate from styled-components and
  emotion.

  Set the `syntax` option to `template-literal` in the panda config to enable this feature.

  ```js
  // panda.config.ts
  export default defineConfig({
    //...
    syntax: 'template-literal',
  })
  ```

  > For existing projects, you might need to run the `panda codegen --clean`

  You can also use the `--syntax` option to specify the syntax type when using the CLI.

  ```sh
  panda init -p --syntax template-literal
  ```

  To get autocomplete for token variables, consider using the
  [CSS Var Autocomplete](https://marketplace.visualstudio.com/items?itemName=phoenisx.cssvar) extension.

### Patch Changes

- Updated dependencies [60df9bd1]
- Updated dependencies [ead9eaa3]
  - @pandacss/shared@0.5.0
  - @pandacss/types@0.5.0
  - @pandacss/core@0.5.0
  - @pandacss/token-dictionary@0.5.0
  - @pandacss/is-valid-prop@0.5.0
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

- 54a8913c: Fix issue where patterns that include css selectors doesn't work in JSX
- a48e5b00: Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```bash
  panda codegen --watch
  ```

- Updated dependencies [2a1e9386]
- Updated dependencies [54a8913c]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/core@0.4.0
  - @pandacss/is-valid-prop@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/token-dictionary@0.4.0
  - @pandacss/logger@0.4.0
  - @pandacss/shared@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/core@0.3.2
- @pandacss/is-valid-prop@0.3.2
- @pandacss/logger@0.3.2
- @pandacss/shared@0.3.2
- @pandacss/token-dictionary@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/core@0.3.1
  - @pandacss/is-valid-prop@0.3.1
  - @pandacss/logger@0.3.1
  - @pandacss/shared@0.3.1
  - @pandacss/token-dictionary@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Minor Changes

- 6d81ee9e: - Set default jsx factory to 'styled'
  - Fix issue where pattern JSX was not being generated correctly when properties are not defined

### Patch Changes

- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
  - @pandacss/core@0.3.0
  - @pandacss/token-dictionary@0.3.0
  - @pandacss/is-valid-prop@0.3.0
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
  - @pandacss/core@0.0.2
  - @pandacss/is-valid-prop@0.0.2
  - @pandacss/logger@0.0.2
  - @pandacss/shared@0.0.2
  - @pandacss/token-dictionary@0.0.2
