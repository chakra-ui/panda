# @pandacss/preset-panda

## 1.7.0

### Patch Changes

- Updated dependencies [86b30b1]
  - @pandacss/types@1.7.0

## 1.6.1

### Patch Changes

- @pandacss/types@1.6.1

## 1.6.0

### Patch Changes

- @pandacss/types@1.6.0

## 1.5.1

### Patch Changes

- @pandacss/types@1.5.1

## 1.5.0

### Patch Changes

- Updated dependencies [91c65ff]
  - @pandacss/types@1.5.0

## 1.4.3

### Patch Changes

- @pandacss/types@1.4.3

## 1.4.2

### Patch Changes

- @pandacss/types@1.4.2

## 1.4.1

### Patch Changes

- @pandacss/types@1.4.1

## 1.4.0

### Minor Changes

- 29cf719: - **Preset Base**: Change default spacing from `10px` and `8px`
  - **Preset Panda**: Add `5.5` to spacing scale to cover more minor scales

### Patch Changes

- @pandacss/types@1.4.0

## 1.3.1

### Patch Changes

- @pandacss/types@1.3.1

## 1.3.0

### Patch Changes

- Updated dependencies [70efd73]
  - @pandacss/types@1.3.0

## 1.2.0

### Patch Changes

- ae7cc8d: Add `4.5` to spacing and sizing scales which maps to `18px`
  - @pandacss/types@1.2.0

## 1.1.0

### Patch Changes

- Updated dependencies [47a0011]
- Updated dependencies [e8ec0aa]
  - @pandacss/types@1.1.0

## 1.0.1

### Patch Changes

- @pandacss/types@1.0.1

## 1.0.0

### Major Changes

- a3bcbea: Stable release of PandaCSS

  ### Style Context

  Add `createStyleContext` function to framework artifacts for React, Preact, Solid, and Vue frameworks

  ```tsx
  import { sva } from 'styled-system/css'
  import { createStyleContext } from 'styled-system/jsx'

  const card = sva({
    slots: ['root', 'label'],
    base: {
      root: {
        color: 'red',
        bg: 'red.300',
      },
      label: {
        fontWeight: 'medium',
      },
    },
    variants: {
      size: {
        sm: {
          root: {
            padding: '10px',
          },
        },
        md: {
          root: {
            padding: '20px',
          },
        },
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  })

  const { withProvider, withContext } = createStyleContext(card)

  const CardRoot = withProvider('div', 'root')
  const CardLabel = withContext('label', 'label')
  ```

  Then, use like this:

  ```tsx
  <CardRoot size="sm">
    <CardLabel>Hello</CardLabel>
  </CardRoot>
  ```

### Patch Changes

- Updated dependencies [a3bcbea]
  - @pandacss/types@1.0.0

## 0.54.0

### Patch Changes

- @pandacss/types@0.54.0

## 0.53.7

### Patch Changes

- @pandacss/types@0.53.7

## 0.53.6

### Patch Changes

- @pandacss/types@0.53.6

## 0.53.5

### Patch Changes

- @pandacss/types@0.53.5

## 0.53.4

### Patch Changes

- @pandacss/types@0.53.4

## 0.53.3

### Patch Changes

- @pandacss/types@0.53.3

## 0.53.2

### Patch Changes

- @pandacss/types@0.53.2

## 0.53.1

### Patch Changes

- @pandacss/types@0.53.1

## 0.53.0

### Patch Changes

- Updated dependencies [5286731]
  - @pandacss/types@0.53.0

## 0.52.0

### Patch Changes

- @pandacss/types@0.52.0

## 0.51.1

### Patch Changes

- @pandacss/types@0.51.1

## 0.51.0

### Patch Changes

- Updated dependencies [d68ad1f]
  - @pandacss/types@0.51.0

## 0.50.0

### Patch Changes

- Updated dependencies [fea78c7]
- Updated dependencies [ad89b90]
  - @pandacss/types@0.50.0

## 0.49.0

### Minor Changes

- 97a0e4d: Add support for animation styles. Animation styles focus solely on animations, allowing you to orchestrate
  animation properties.

  > Pairing animation styles with text styles and layer styles can make your styles a lot cleaner.

  Here's an example of this:

  ```jsx
  import { defineAnimationStyles } from '@pandacss/dev'

  export const animationStyles = defineAnimationStyles({
    'slide-fade-in': {
      value: {
        transformOrigin: 'var(--transform-origin)',
        animationDuration: 'fast',
        '&[data-placement^=top]': {
          animationName: 'slide-from-top, fade-in',
        },
        '&[data-placement^=bottom]': {
          animationName: 'slide-from-bottom, fade-in',
        },
        '&[data-placement^=left]': {
          animationName: 'slide-from-left, fade-in',
        },
        '&[data-placement^=right]': {
          animationName: 'slide-from-right, fade-in',
        },
      },
    },
  })
  ```

  With that defined, I can use it in my recipe or css like so:

  ```js
  export const popoverSlotRecipe = defineSlotRecipe({
    slots: anatomy.keys(),
    base: {
      content: {
        _open: {
          animationStyle: 'scale-fade-in',
        },
        _closed: {
          animationStyle: 'scale-fade-out',
        },
      },
    },
  })
  ```

  This feature will drive consumers to lean in towards CSS for animations rather than JS. Composing animation names is a
  powerful feature we should encourage consumers to use.

### Patch Changes

- Updated dependencies [97a0e4d]
  - @pandacss/types@0.49.0

## 0.48.1

### Patch Changes

- @pandacss/types@0.48.1

## 0.48.0

### Patch Changes

- @pandacss/types@0.48.0

## 0.47.1

### Patch Changes

- @pandacss/types@0.47.1

## 0.47.0

### Patch Changes

- Updated dependencies [5e683ee]
  - @pandacss/types@0.47.0

## 0.46.1

### Patch Changes

- @pandacss/types@0.46.1

## 0.46.0

### Patch Changes

- @pandacss/types@0.46.0

## 0.45.2

### Patch Changes

- @pandacss/types@0.45.2

## 0.45.1

### Patch Changes

- @pandacss/types@0.45.1

## 0.45.0

### Patch Changes

- Updated dependencies [dcc9053]
  - @pandacss/types@0.45.0

## 0.44.0

### Patch Changes

- Updated dependencies [c99cb75]
  - @pandacss/types@0.44.0

## 0.43.0

### Patch Changes

- Updated dependencies [e952f82]
  - @pandacss/types@0.43.0

## 0.42.0

### Minor Changes

- e157dd1: - Ensure classnames are unique across utilities to prevent potential clash
  - Add support for `4xl` border radius token

### Patch Changes

- Updated dependencies [e157dd1]
- Updated dependencies [19c3a2c]
- Updated dependencies [f00ff88]
- Updated dependencies [17a1932]
  - @pandacss/types@0.42.0

## 0.41.0

### Patch Changes

- @pandacss/types@0.41.0

## 0.40.1

### Patch Changes

- @pandacss/types@0.40.1

## 0.40.0

### Patch Changes

- @pandacss/types@0.40.0

## 0.39.2

### Patch Changes

- @pandacss/types@0.39.2

## 0.39.1

### Patch Changes

- @pandacss/types@0.39.1

## 0.39.0

### Patch Changes

- Updated dependencies [221c9a2]
- Updated dependencies [c3e797e]
  - @pandacss/types@0.39.0

## 0.38.0

### Patch Changes

- Updated dependencies [96b47b3]
- Updated dependencies [bc09d89]
  - @pandacss/types@0.38.0

## 0.37.2

### Patch Changes

- Updated dependencies [74dfb3e]
  - @pandacss/types@0.37.2

## 0.37.1

### Patch Changes

- Updated dependencies [885963c]
  - @pandacss/types@0.37.1

## 0.37.0

### Patch Changes

- Updated dependencies [bcfb5c5]
- Updated dependencies [6247dfb]
  - @pandacss/types@0.37.0

## 0.36.1

### Patch Changes

- Updated dependencies [bd0cb07]
  - @pandacss/types@0.36.1

## 0.36.0

### Patch Changes

- Updated dependencies [861a280]
- Updated dependencies [2691f16]
- Updated dependencies [340f4f1]
- Updated dependencies [fabdabe]
  - @pandacss/types@0.36.0

## 0.35.0

### Patch Changes

- Updated dependencies [50db354]
- Updated dependencies [f6befbf]
- Updated dependencies [a0c4d27]
  - @pandacss/types@0.35.0

## 0.34.3

### Patch Changes

- @pandacss/types@0.34.3

## 0.34.2

### Patch Changes

- @pandacss/types@0.34.2

## 0.34.1

### Patch Changes

- @pandacss/types@0.34.1

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

- bee3ec85: Add support for aspect ratio tokens in the panda config or preset. Aspect ratio tokens are used to define
  the aspect ratio of an element.

  ```js
  export default defineConfig({
    // ...
    theme: {
      extend: {
        // add aspect ratio tokens
        tokens: {
          aspectRatios: {
            '1:1': '1',
            '16:9': '16/9',
          },
        },
      },
    },
  })
  ```

  Here's what the default aspect ratio tokens in the base preset looks like:

  ```json
  {
    "square": { "value": "1 / 1" },
    "landscape": { "value": "4 / 3" },
    "portrait": { "value": "3 / 4" },
    "wide": { "value": "16 / 9" },
    "ultrawide": { "value": "18 / 5" },
    "golden": { "value": "1.618 / 1" }
  }
  ```

  **Breaking Change**

  The built-in token values has been removed from the `aspectRatio` utility to the `@pandacss/preset-base` as a token.

  For most users, this change should be a drop-in replacement. However, if you used a custom preset in the config, you
  might need to update it to include the new aspect ratio tokens.

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

- Updated dependencies [526c6e34]
  - @pandacss/types@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [5b061615]
- Updated dependencies [105f74ce]
  - @pandacss/types@0.21.0

## 0.20.1

### Patch Changes

- @pandacss/types@0.20.1

## 0.20.0

### Patch Changes

- Updated dependencies [24ee49a5]
- Updated dependencies [904aec7b]
  - @pandacss/types@0.20.0

## 0.19.0

### Patch Changes

- Updated dependencies [61831040]
- Updated dependencies [89f86923]
  - @pandacss/types@0.19.0

## 0.18.3

### Patch Changes

- @pandacss/types@0.18.3

## 0.18.2

### Patch Changes

- @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- @pandacss/types@0.18.1

## 0.18.0

### Patch Changes

- @pandacss/types@0.18.0

## 0.17.5

### Patch Changes

- @pandacss/types@0.17.5

## 0.17.4

### Patch Changes

- Updated dependencies [fa77080a]
  - @pandacss/types@0.17.4

## 0.17.3

### Patch Changes

- Updated dependencies [529a262e]
  - @pandacss/types@0.17.3

## 0.17.2

### Patch Changes

- @pandacss/types@0.17.2

## 0.17.1

### Patch Changes

- @pandacss/types@0.17.1

## 0.17.0

### Patch Changes

- Updated dependencies [fc4688e6]
  - @pandacss/types@0.17.0

## 0.16.0

### Patch Changes

- @pandacss/types@0.16.0

## 0.15.5

### Patch Changes

- @pandacss/types@0.15.5

## 0.15.4

### Patch Changes

- @pandacss/types@0.15.4

## 0.15.3

### Patch Changes

- Updated dependencies [1ac2011b]
- Updated dependencies [58743bc4]
  - @pandacss/types@0.15.3

## 0.15.2

### Patch Changes

- Updated dependencies [26a788c0]
  - @pandacss/types@0.15.2

## 0.15.1

### Patch Changes

- @pandacss/types@0.15.1

## 0.15.0

### Patch Changes

- Updated dependencies [4bc515ea]
- Updated dependencies [39298609]
  - @pandacss/types@0.15.0

## 0.14.0

### Patch Changes

- Updated dependencies [8106b411]
- Updated dependencies [e6459a59]
- Updated dependencies [6f7ee198]
  - @pandacss/types@0.14.0

## 0.13.1

### Patch Changes

- @pandacss/types@0.13.1

## 0.13.0

### Patch Changes

- @pandacss/types@0.13.0

## 0.12.2

### Patch Changes

- @pandacss/types@0.12.2

## 0.12.1

### Patch Changes

- @pandacss/types@0.12.1

## 0.12.0

### Patch Changes

- @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [23b516f4]
  - @pandacss/types@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0

## 0.10.0

### Patch Changes

- Updated dependencies [24e783b3]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/types@0.10.0

## 0.9.0

### Patch Changes

- Updated dependencies [c08de87f]
  - @pandacss/types@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [be0ad578]
  - @pandacss/types@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [a9c189b7]
  - @pandacss/types@0.7.0

## 0.6.0

### Patch Changes

- @pandacss/types@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1

## 0.5.0

### Patch Changes

- 3a87cff8: Update the color palette to match Tailwind's new palette.
- Updated dependencies [ead9eaa3]
  - @pandacss/types@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/types@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- bd5c049b: Initial release
- Updated dependencies [6d81ee9e]
  - @pandacss/types@0.3.0
