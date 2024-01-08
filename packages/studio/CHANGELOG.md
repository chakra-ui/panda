# @pandacss/studio

## 0.25.0

### Patch Changes

- Updated dependencies [59fd291c]
- Updated dependencies [de282f60]
  - @pandacss/types@0.25.0
  - @pandacss/token-dictionary@0.25.0
  - @pandacss/astro-plugin-studio@0.25.0
  - @pandacss/config@0.25.0
  - @pandacss/logger@0.25.0
  - @pandacss/shared@0.25.0

## 0.24.2

### Patch Changes

- Updated dependencies [71e82a4e]
  - @pandacss/shared@0.24.2
  - @pandacss/types@0.24.2
  - @pandacss/config@0.24.2
  - @pandacss/token-dictionary@0.24.2
  - @pandacss/astro-plugin-studio@0.24.2
  - @pandacss/logger@0.24.2

## 0.24.1

### Patch Changes

- @pandacss/astro-plugin-studio@0.24.1
- @pandacss/config@0.24.1
- @pandacss/logger@0.24.1
- @pandacss/shared@0.24.1
- @pandacss/token-dictionary@0.24.1
- @pandacss/types@0.24.1

## 0.24.0

### Patch Changes

- Updated dependencies [f6881022]
  - @pandacss/types@0.24.0
  - @pandacss/astro-plugin-studio@0.24.0
  - @pandacss/config@0.24.0
  - @pandacss/token-dictionary@0.24.0
  - @pandacss/logger@0.24.0
  - @pandacss/shared@0.24.0

## 0.23.0

### Patch Changes

- Updated dependencies [bd552b1f]
  - @pandacss/logger@0.23.0
  - @pandacss/astro-plugin-studio@0.23.0
  - @pandacss/config@0.23.0
  - @pandacss/shared@0.23.0
  - @pandacss/token-dictionary@0.23.0
  - @pandacss/types@0.23.0

## 0.22.1

### Patch Changes

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
  - @pandacss/config@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/astro-plugin-studio@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Minor Changes

- 11753fea: - Redesign astro integration and studio to use the new Astro v4 (experimental) JavaScript API
  - Update Astro version to v4 for the @pandacss/studio

### Patch Changes

- 1cc8fcff: Fixes a missing bracket in \_indeterminate condition
- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/config@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/astro-plugin-studio@0.22.0
  - @pandacss/logger@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [7f846be2]
- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/node@0.21.0
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/config@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/config@0.20.1
- @pandacss/node@0.20.1
- @pandacss/token-dictionary@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/config@0.20.0
  - @pandacss/types@0.20.0
  - @pandacss/node@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/node@0.19.0
  - @pandacss/config@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- a30f660d: Fix issue in studio here userland `@ark-ui/react` version could interfere with studio version
  - @pandacss/node@0.18.3
  - @pandacss/config@0.18.3
  - @pandacss/logger@0.18.3
  - @pandacss/shared@0.18.3
  - @pandacss/token-dictionary@0.18.3
  - @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/config@0.18.2
- @pandacss/node@0.18.2
- @pandacss/token-dictionary@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- aac7b379: Fix an issue with the `grid` pattern from @pandacss/preset-base (included by default), setting a
  minChildWidth wasn't interpreted as a token value

  Before:

  ```tsx
  <div className={grid({ minChildWidth: '80px', gap: 8 })} />
  // ✅ grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))

  <div className={grid({ minChildWidth: '20', gap: 8 })} />
  // ❌ grid-template-columns: repeat(auto-fit, minmax(20, 1fr))
  //                                                  ^^^
  ```

  After:

  ```tsx
  <div className={grid({ minChildWidth: '80px', gap: 8 })} />
  // ✅ grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))

  <div className={grid({ minChildWidth: '20', gap: 8 })} />
  // ✅ grid-template-columns: repeat(auto-fit, minmax(var(--sizes-20, 20), 1fr))
  //                                                  ^^^^^^^^^^^^^^^^^^^
  ```

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/config@0.18.1
  - @pandacss/node@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- b840e469: Improve semantic colors in studio
- Updated dependencies [ba9e32fa]
- Updated dependencies [3010af28]
- Updated dependencies [866c12aa]
  - @pandacss/shared@0.18.0
  - @pandacss/node@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/config@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- abe35313: Fix issue where error is thrown for semantic tokens with raw values.
- Updated dependencies [17f68b3f]
  - @pandacss/node@0.17.5
  - @pandacss/config@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- a031d077: Display semantic colors correctly in studio.
- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/config@0.17.4
  - @pandacss/node@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
- Updated dependencies [60f2c8a3]
  - @pandacss/types@0.17.3
  - @pandacss/node@0.17.3
  - @pandacss/config@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/config@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/node@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- 87772c7c: Add `--host` and `--port` flags to studio.
- 7b981422: Fix issue in reset styles where button does not inherit color style
- Updated dependencies [56299cb2]
- Updated dependencies [ddcaf7b2]
- Updated dependencies [5ce359f6]
  - @pandacss/node@0.17.1
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/config@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- fc4688e6: Export all types from @pandacss/types, which will also export all types exposed in the outdir/types

  Also make the `config.prefix` object Partial so that each key is optional.

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
- Updated dependencies [dd6811b3]
  - @pandacss/shared@0.17.0
  - @pandacss/node@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/config@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- Updated dependencies [20f4e204]
- Updated dependencies [36252b1d]
  - @pandacss/node@0.16.0
  - @pandacss/config@0.16.0
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- Updated dependencies [909fcbe8]
  - @pandacss/node@0.15.5
  - @pandacss/config@0.15.5
  - @pandacss/logger@0.15.5
  - @pandacss/shared@0.15.5
  - @pandacss/token-dictionary@0.15.5
  - @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

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

- Updated dependencies [abd7c47a]
  - @pandacss/config@0.15.4
  - @pandacss/node@0.15.4
  - @pandacss/types@0.15.4
  - @pandacss/logger@0.15.4
  - @pandacss/shared@0.15.4
  - @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

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
  - @pandacss/types@0.15.3
  - @pandacss/node@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/config@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- 26a788c0: - Switch to interface for runtime types
  - Create custom partial types for each config object property
- f3c30d60: Fix issue where studio uses studio config, instead of custom panda config.
- Updated dependencies [f3c30d60]
- Updated dependencies [26a788c0]
- Updated dependencies [2645c2da]
  - @pandacss/node@0.15.2
  - @pandacss/types@0.15.2
  - @pandacss/config@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 7e8bcb03: Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/node@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/config@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Patch Changes

- 39298609: Make the types suggestion faster (updated `DeepPartial`)
- f27146d6: Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when
  using `Regex` in the `jsx` field of a config, resulting in some style props missing.

  issue: https://github.com/chakra-ui/panda/issues/1315

- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/node@0.15.0
  - @pandacss/config@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- bff17df2: Add each condition raw value information on hover using JSDoc annotation
- 6f7ee198: Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like
  with `{cvaFn}.raw`
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/node@0.14.0
  - @pandacss/config@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- 577dcb9d: Fix issue where Panda does not detect styles after nested template in vue
- Updated dependencies [d0fbc7cc]
  - @pandacss/config@0.13.1
  - @pandacss/node@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/node@0.13.0
- @pandacss/config@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/node@0.12.2
- @pandacss/config@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/node@0.12.1
- @pandacss/config@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- 4c8c1715: Export types for all `define` helper functions
- bf2ff391: Add `animationName` utility
  - @pandacss/node@0.12.0
  - @pandacss/config@0.12.0
  - @pandacss/token-dictionary@0.12.0
  - @pandacss/logger@0.12.0
  - @pandacss/shared@0.12.0
  - @pandacss/types@0.12.0
