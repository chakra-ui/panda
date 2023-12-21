# @pandacss/core

## 0.22.1

### Patch Changes

- Updated dependencies [8f4ce97c]
- Updated dependencies [647f05c9]
  - @pandacss/types@0.22.1
  - @pandacss/shared@0.22.1
  - @pandacss/token-dictionary@0.22.1
  - @pandacss/error@0.22.1
  - @pandacss/logger@0.22.1

## 0.22.0

### Patch Changes

- 11753fea: Improve initial css extraction time by at least 5x 🚀

  Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

  **Scenarios**

  - Park UI went from 3500ms to 580ms (6x faster)
  - Panda Website went from 2900ms to 208ms (14x faster)

  **Potential Breaking Change**

  If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css`
  string for performance reasons. We might reconsider this in the future.

- Updated dependencies [526c6e34]
- Updated dependencies [8db47ec6]
  - @pandacss/types@0.22.0
  - @pandacss/shared@0.22.0
  - @pandacss/token-dictionary@0.22.0
  - @pandacss/error@0.22.0
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

- 788aaba3: Fix an edge-case when Panda eagerly extracted and tried to generate the CSS for a JSX property that contains
  an URL.

  ```tsx
  const App = () => {
    // here the content property is a valid CSS property, so Panda will try to generate the CSS for it
    // but since it's an URL, it would produce invalid CSS
    // we now check if the property value is an URL and skip it if needed
    return <CopyButton content="https://www.buymeacoffee.com/grizzlycodes" />
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

- Updated dependencies [26e6051a]
- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/shared@0.21.0
  - @pandacss/types@0.21.0
  - @pandacss/token-dictionary@0.21.0
  - @pandacss/error@0.21.0
  - @pandacss/logger@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/token-dictionary@0.20.1
- @pandacss/error@0.20.1
- @pandacss/logger@0.20.1
- @pandacss/shared@0.20.1
- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- 24ee49a5: - Add support for granular config change detection
  - Improve the `codegen` experience by only rewriting files affecteds by a config change
- 4ba982f3: Fix issue with the `token(xxx.yyy)` fn used in AtRule, things like:

  ```ts
  css({
    '@container (min-width: token(sizes.xl))': {
      color: 'green.300',
    },
    '@media (min-width: token(sizes.2xl))': {
      color: 'red.300',
    },
  })
  ```

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0
  - @pandacss/token-dictionary@0.20.0
  - @pandacss/error@0.20.0
  - @pandacss/logger@0.20.0
  - @pandacss/shared@0.20.0

## 0.19.0

### Patch Changes

- 9f5711f9: Fix issue where recipe artifacts might not match the recipes defined in the theme due to the internal cache
  not being cleared as needed.
- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0
  - @pandacss/token-dictionary@0.19.0
  - @pandacss/error@0.19.0
  - @pandacss/logger@0.19.0
  - @pandacss/shared@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/error@0.18.3
- @pandacss/logger@0.18.3
- @pandacss/shared@0.18.3
- @pandacss/token-dictionary@0.18.3
- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/token-dictionary@0.18.2
- @pandacss/error@0.18.2
- @pandacss/logger@0.18.2
- @pandacss/shared@0.18.2
- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- 8c76cd0f: - Fix issue where `hideBelow` breakpoints are inclusive of the specified breakpoints

  ```jsx
  css({ hideBelow: 'lg' })
  // => @media screen and (max-width: 63.9975em) { background: red; }
  ```

  - Support arbitrary breakpoints in `hideBelow` and `hideFrom` utilities

  ```jsx
  css({ hideFrom: '800px' })
  // => @media screen and (min-width: 800px) { background: red; }
  ```

- Updated dependencies [566fd28a]
- Updated dependencies [43bfa510]
  - @pandacss/token-dictionary@0.18.1
  - @pandacss/error@0.18.1
  - @pandacss/logger@0.18.1
  - @pandacss/shared@0.18.1
  - @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- Updated dependencies [ba9e32fa]
  - @pandacss/shared@0.18.0
  - @pandacss/token-dictionary@0.18.0
  - @pandacss/types@0.18.0
  - @pandacss/error@0.18.0
  - @pandacss/logger@0.18.0

## 0.17.5

### Patch Changes

- a6dfc944: Fix issue where using array syntax in config recipe generates invalid css
  - @pandacss/error@0.17.5
  - @pandacss/logger@0.17.5
  - @pandacss/shared@0.17.5
  - @pandacss/token-dictionary@0.17.5
  - @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4
  - @pandacss/token-dictionary@0.17.4
  - @pandacss/error@0.17.4
  - @pandacss/logger@0.17.4
  - @pandacss/shared@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3
  - @pandacss/token-dictionary@0.17.3
  - @pandacss/error@0.17.3
  - @pandacss/logger@0.17.3
  - @pandacss/shared@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/error@0.17.2
- @pandacss/logger@0.17.2
- @pandacss/shared@0.17.2
- @pandacss/token-dictionary@0.17.2
- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- aea28c9f: Fix issue where using scale css property adds an additional 'px'
- Updated dependencies [5ce359f6]
  - @pandacss/shared@0.17.1
  - @pandacss/types@0.17.1
  - @pandacss/token-dictionary@0.17.1
  - @pandacss/error@0.17.1
  - @pandacss/logger@0.17.1

## 0.17.0

### Patch Changes

- e73ea803: Automatically add each recipe slots to the `jsx` property, with a dot notation

  ```ts
  const button = defineSlotRecipe({
    className: 'button',
    slots: ['root', 'icon', 'label'],
    // ...
  })
  ```

  will have a default `jsx` property of: `[Button, Button.Root, Button.Icon, Button.Label]`

- Updated dependencies [12281ff8]
- Updated dependencies [fc4688e6]
  - @pandacss/shared@0.17.0
  - @pandacss/types@0.17.0
  - @pandacss/token-dictionary@0.17.0
  - @pandacss/error@0.17.0
  - @pandacss/logger@0.17.0

## 0.16.0

### Patch Changes

- 20f4e204: Apply a few optmizations on the resulting CSS generated from `panda cssgen` command
  - @pandacss/token-dictionary@0.16.0
  - @pandacss/error@0.16.0
  - @pandacss/logger@0.16.0
  - @pandacss/shared@0.16.0
  - @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/error@0.15.5
- @pandacss/logger@0.15.5
- @pandacss/shared@0.15.5
- @pandacss/token-dictionary@0.15.5
- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4
- @pandacss/error@0.15.4
- @pandacss/logger@0.15.4
- @pandacss/shared@0.15.4
- @pandacss/token-dictionary@0.15.4

## 0.15.3

### Patch Changes

- 95b06bb1: Fix issue in template literal mode where media queries doesn't work
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

- Updated dependencies [95b06bb1]
- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/shared@0.15.3
  - @pandacss/types@0.15.3
  - @pandacss/token-dictionary@0.15.3
  - @pandacss/error@0.15.3
  - @pandacss/logger@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2
  - @pandacss/token-dictionary@0.15.2
  - @pandacss/error@0.15.2
  - @pandacss/logger@0.15.2
  - @pandacss/shared@0.15.2

## 0.15.1

### Patch Changes

- 848936e0: Allow referencing tokens with the `token()` function in media queries or any other CSS at-rule.

  ```js
  import { css } from '../styled-system/css'

  const className = css({
    '@media screen and (min-width: token(sizes.4xl))': {
      color: 'green.400',
    },
  })
  ```

- Updated dependencies [26f6982c]
- Updated dependencies [4e003bfb]
  - @pandacss/shared@0.15.1
  - @pandacss/token-dictionary@0.15.1
  - @pandacss/types@0.15.1
  - @pandacss/error@0.15.1
  - @pandacss/logger@0.15.1

## 0.15.0

### Minor Changes

- bc3b077d: Move slot recipes styles to new `recipes.slots` layer so that classic config recipes will have a higher
  specificity

### Patch Changes

- dd47b6e6: Fix issue where hideFrom doesn't work due to incorrect breakpoint computation
- Updated dependencies [4bc515ea]
- Updated dependencies [9f429d35]
- Updated dependencies [39298609]
- Updated dependencies [f27146d6]
  - @pandacss/types@0.15.0
  - @pandacss/shared@0.15.0
  - @pandacss/token-dictionary@0.15.0
  - @pandacss/error@0.15.0
  - @pandacss/logger@0.15.0

## 0.14.0

### Patch Changes

- e6459a59: The utility transform fn now allow retrieving the token object with the raw value/conditions as currently
  there's no way to get it from there.
- 623e321f: Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- 02161d41: Fix issue with the `token()` function in CSS strings that produced CSS syntax error when non-existing token
  were left unchanged (due to the `.`)

  Before:

  ```css
  * {
    color: token(colors.magenta, pink);
  }
  ```

  Now:

  ```css
  * {
    color: token('colors.magenta', pink);
  }
  ```

- Updated dependencies [b1c31fdd]
- Updated dependencies [8106b411]
- Updated dependencies [9e799554]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/token-dictionary@0.14.0
  - @pandacss/types@0.14.0
  - @pandacss/error@0.14.0
  - @pandacss/logger@0.14.0
  - @pandacss/shared@0.14.0

## 0.13.1

### Patch Changes

- Updated dependencies [d0fbc7cc]
  - @pandacss/error@0.13.1
  - @pandacss/logger@0.13.1
  - @pandacss/shared@0.13.1
  - @pandacss/token-dictionary@0.13.1
  - @pandacss/types@0.13.1

## 0.13.0

### Minor Changes

- 04b5fd6c: - Add support for minification in `cssgen` command.
  - Fix issue where `panda --minify` does not work.

### Patch Changes

- @pandacss/error@0.13.0
- @pandacss/logger@0.13.0
- @pandacss/shared@0.13.0
- @pandacss/token-dictionary@0.13.0
- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/error@0.12.2
- @pandacss/logger@0.12.2
- @pandacss/shared@0.12.2
- @pandacss/token-dictionary@0.12.2
- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/error@0.12.1
- @pandacss/logger@0.12.1
- @pandacss/shared@0.12.1
- @pandacss/token-dictionary@0.12.1
- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/token-dictionary@0.12.0
- @pandacss/error@0.12.0
- @pandacss/logger@0.12.0
- @pandacss/shared@0.12.0
- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- 23b516f4: Make layers customizable
- Updated dependencies [c07e1beb]
- Updated dependencies [23b516f4]
  - @pandacss/shared@0.11.1
  - @pandacss/types@0.11.1
  - @pandacss/token-dictionary@0.11.1
  - @pandacss/error@0.11.1
  - @pandacss/logger@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0
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

- 2d2a42da: Fix staticCss recipe generation when a recipe didnt have `variants`, only a `base`
- Updated dependencies [24e783b3]
- Updated dependencies [9d4aa918]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/shared@0.10.0
  - @pandacss/types@0.10.0
  - @pandacss/token-dictionary@0.10.0
  - @pandacss/error@0.10.0
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
  - @pandacss/token-dictionary@0.9.0
  - @pandacss/error@0.9.0
  - @pandacss/logger@0.9.0
  - @pandacss/shared@0.9.0

## 0.8.0

### Patch Changes

- fb449016: Fix cases where Stitches `styled.withConfig` would be misinterpreted as a panda fn and lead to this error:

  ```ts
  TypeError: Cannot read properties of undefined (reading 'startsWith')
      at /panda/packages/shared/dist/index.js:433:16
      at get (/panda/packages/shared/dist/index.js:116:20)
      at Utility.setClassName (/panda/packages/core/dist/index.js:1682:66)
      at inner (/panda/packages/core/dist/index.js:1705:14)
      at Utility.getOrCreateClassName (/panda/packages/core/dist/index.js:1709:12)
      at AtomicRule.transform (/panda/packages/core/dist/index.js:1729:23)
      at /panda/packages/core/dist/index.js:323:32
      at inner (/panda/packages/shared/dist/index.js:219:12)
      at walkObject (/panda/packages/shared/dist/index.js:221:10)
      at AtomicRule.process (/panda/packages/core/dist/index.js:317:35)
  ```

- ac078416: Fix issue with extracting nested tokens as color-palette. Fix issue with extracting shadow array as a
  separate unnamed block for the custom dark condition.
- Updated dependencies [ac078416]
- Updated dependencies [be0ad578]
  - @pandacss/token-dictionary@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/error@0.8.0
  - @pandacss/logger@0.8.0
  - @pandacss/shared@0.8.0

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
