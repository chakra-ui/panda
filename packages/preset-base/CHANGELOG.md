# @pandacss/preset-base

## 2.0.0-beta.10

### Patch Changes

- d697a8e: Emit `-webkit-backdrop-filter` before `backdrop-filter` so Lightning CSS keeps the unprefixed declaration.
- Updated dependencies [52e84e6]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/types@2.0.0-beta.10

## 1.9.1

### Patch Changes

- Fix `Spacer` pattern not resolving spacing tokens for the `size` prop.

  Previously, `<Spacer size="5" />` would generate invalid CSS (`flex: 0 0 5`) instead of resolving the spacing token.
  Now it correctly outputs `flex: 0 0 var(--spacing-5, 5)`.

  **Before (broken):** `flex: 0 0 5` — raw value, not a valid CSS length **After (fixed):**
  `flex: 0 0 var(--spacing-5, 5)` — resolved spacing token

  Closes #3490

  - @pandacss/types@1.9.1

## 1.7.3

### Patch Changes

- **Gradient Utilities**: Fixed `token()` and brace syntax not working in `bgGradient`, `bgLinear`, and `textGradient`
  utilities.

  Before this fix, using token references in gradient values would not expand correctly:

  ```jsx
  // ❌ Before: token references were ignored
  css({ bgGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' })
  // Output: background-image: linear-gradient(var(--gradient-stops))

  // ✅ After: token references are properly expanded
  css({ bgGradient: 'linear-gradient({colors.red.200}, {colors.blue.300})' })
  // Output: background-image: linear-gradient(var(--colors-red-200), var(--colors-blue-300))
  ```

  Both `token()` function syntax and brace syntax `{...}` now work correctly in gradient utilities.

  - @pandacss/types@1.7.3

## 1.7.1

### Patch Changes

- Ensure the `WebkitTextFillColor` utility can accept color token values, like other color utilities.
  - @pandacss/types@1.7.1

## 1.4.0

### Minor Changes

- **Preset Base**: Change default spacing from `10px` and `8px`
  - **Preset Panda**: Add `5.5` to spacing scale to cover more minor scales

### Patch Changes

- Fix regression in `_marker` condition due to the use of `:is()` which doesn't work for pseudo elements.
  - @pandacss/types@1.4.0

## 1.3.0

### Minor Changes

- Added new transition values and enhanced transition property utilities

  - `size` → `width, height, min-width, max-width, min-height, max-height`
  - `position` → `left, right, top, bottom, inset, inset-inline, inset-block`
  - `background` → `background, background-color, background-image, background-position`

  ```tsx
  import { css } from 'styled-system/css'

  // Transition shorthand values
  css({ transition: 'size' })

  // Property groups
  css({ transitionProperty: 'size', transitionDuration: '300ms' })
  ```

## 1.2.0

### Minor Changes

- Add new utilities for managing focus rings with `focusRing` and `focusVisibleRing` properties

  - `focusRing`: Style focus states using `&:is(:focus, [data-focus])` selector with `outside`, `inside`, `mixed`, or
    `none` values
  - `focusVisibleRing`: Style keyboard-only focus using `&:is(:focus-visible, [data-focus-visible])` selector
  - `focusRingColor`, `focusRingWidth`, `focusRingStyle`, and `focusRingOffset` for fine-tuned control
  - Configure the global focus ring color with `--global-color-focus-ring` in global CSS

  ```tsx
  <div
    className={css({
      focusRing: 'outside',
      focusVisibleRing: 'inside',
      focusRingColor: 'blue.300',
    })}
  >
    Click me
  </div>
  ```

## 1.0.1

### Patch Changes

- Fix issue where `bgGradient` did not respect the gradient token.
  - @pandacss/types@1.0.1

## 1.0.0

### Major Changes

- Fix issue where `rtl` and `ltr` variants does not work with `[dir=auto]`
  - Add `::-webkit-details-marker` to `marker` condition
  - Add new `inset-2xs`, `inset-xs` and `inset-sm` shadows
  - Add new `noscript` and `inverted-colors` conditions
  - Add `:popover-open` to `open` condition
  - Removed `inner` shadow in favor of `inset-sm`
  - Remap blur tokens:
    - `blurs.sm` -> `blurs.xs`
    - `blurs.base` -> `blurs.sm`
- Stable release of PandaCSS

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

### Minor Changes

- Add support for `bgLinear`, `bgRadial` and `bgConic` properties.

  ### `bgLinear`

  ```tsx
  <div
    className={css({
      bgLinear: 'to-r',
      gradientFrom: 'cyan.500',
      gradientTo: 'blue.500',
    })}
  />
  ```

  ### `bgRadial`

  ```tsx
  <div
    className={css({
      bgRadial: 'in srgb',
      gradientFrom: 'pink.400',
      gradientFromPosition: '40%',
      gradientTo: 'fuchsia.700',
    })}
  />
  ```

  ### `bgConic`

  ```tsx
  <div
    className={css({
      bgConic: 'in srgb',
      gradientFrom: 'blue.600',
      gradientTo: 'sky.400',
      gradientToPosition: '50%',
    })}
  />
  ```

  Add support for `boxSize` property that maps to `width` and `height` properties.

  ```tsx
  <div className={css({ boxSize: '24' })} />
  ```

## 0.54.0

### Minor Changes

- Adds more `aria` attributes to conditions for better accessibility and styling hooks.

  - `[aria-disabled=true]` was added to `disabled`, `peerDisabled`, and `groupDisabled` conditions.
  - `[aria-readonly=true]` was added to the `readOnly` condition.
  - `[aria-invalid=true]` was added to `invalid` and `groupInvalid` conditions.

## 0.53.5

### Patch Changes

- Add tokens for logical border widths
  - @pandacss/types@0.53.5

## 0.53.3

### Patch Changes

- Add cursor utility config
  - @pandacss/types@0.53.3

## 0.53.2

### Patch Changes

- Update `groupInvalid` condition according to other group selector implementations
  - @pandacss/types@0.53.2

## 0.52.0

### Minor Changes

- Add support for new conditions

  - `current` -> `&:is([aria-current=true], [data-current])`
  - `today` -> `&[data-today]`
  - `unavailable` -> `&[data-unavailable]`
  - `rangeStart` -> `&[data-range-start]`
  - `rangeEnd` -> `&[data-range-end]`
  - `now` -> `&[data-now]`
  - `topmost` -> `&[data-topmost]`
  - `icon` -> `& :where(svg)`
  - `complete` -> `&[data-complete]`
  - `incomplete` -> `&[data-incomplete]`
  - `dragging` -> `&[data-dragging]`
  - `grabbed` -> `&[data-grabbed]`
  - `underValue` -> `&[data-state=under-value]`
  - `overValue` -> `&[data-state=over-value]`
  - `atValue` -> `&[data-state=at-value]`
  - `hidden` -> `&:is([hidden], [data-hidden])`

## 0.48.1

### Patch Changes

- Fix issue where `scrollbarGutter` property incorrectly referenced spacing tokens. The only valid values are `auto`,
  `stable`, and `both-edges`.
  - @pandacss/types@0.48.1

## 0.48.0

### Minor Changes

- [Breaking] Remove default utility values for `gridTemplateColumns`, `gridTemplateRows`, `gridColumn` and `gridRow` to
  prevent interference with native css values.

  For example `1` or `2` is a valid native value for `gridColumn` or `gridRow`, and should not be overridden by the
  utility.

  Find the previous default values below, you can add them back to your config if you need them.

  ```ts
  const utilities = {
    gridTemplateColumns: {
      className: 'grid-tc',
      group: 'Grid Layout',
      values: {
        '1': 'repeat(1, minmax(0, 1fr))',
        '2': 'repeat(2, minmax(0, 1fr))',
        '3': 'repeat(3, minmax(0, 1fr))',
        '4': 'repeat(4, minmax(0, 1fr))',
        '5': 'repeat(5, minmax(0, 1fr))',
        '6': 'repeat(6, minmax(0, 1fr))',
        '7': 'repeat(7, minmax(0, 1fr))',
        '8': 'repeat(8, minmax(0, 1fr))',
        '9': 'repeat(9, minmax(0, 1fr))',
        '10': 'repeat(10, minmax(0, 1fr))',
        '11': 'repeat(11, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
      },
    },
    gridTemplateRows: {
      className: 'grid-tr',
      group: 'Grid Layout',
      values: {
        '1': 'repeat(1, minmax(0, 1fr))',
        '2': 'repeat(2, minmax(0, 1fr))',
        '3': 'repeat(3, minmax(0, 1fr))',
        '4': 'repeat(4, minmax(0, 1fr))',
        '5': 'repeat(5, minmax(0, 1fr))',
        '6': 'repeat(6, minmax(0, 1fr))',
        '7': 'repeat(7, minmax(0, 1fr))',
        '8': 'repeat(8, minmax(0, 1fr))',
        '9': 'repeat(9, minmax(0, 1fr))',
        '10': 'repeat(10, minmax(0, 1fr))',
        '11': 'repeat(11, minmax(0, 1fr))',
        '12': 'repeat(12, minmax(0, 1fr))',
      },
    },
    gridColumn: {
      className: 'grid-c',
      group: 'Grid Layout',
      values: {
        full: '1 / -1',
        '1': 'span 1 / span 1',
        '2': 'span 2 / span 2',
        '3': 'span 3 / span 3',
        '4': 'span 4 / span 4',
        '5': 'span 5 / span 5',
        '6': 'span 6 / span 6',
        '7': 'span 7 / span 7',
        '8': 'span 8 / span 8',
        '9': 'span 9 / span 9',
        '10': 'span 10 / span 10',
        '11': 'span 11 / span 11',
        '12': 'span 12 / span 12',
      },
    },
    gridRow: {
      className: 'grid-r',
      group: 'Grid Layout',
      values: {
        full: '1 / -1',
        '1': 'span 1 / span 1',
        '2': 'span 2 / span 2',
        '3': 'span 3 / span 3',
        '4': 'span 4 / span 4',
        '5': 'span 5 / span 5',
        '6': 'span 6 / span 6',
        '7': 'span 7 / span 7',
        '8': 'span 8 / span 8',
        '9': 'span 9 / span 9',
        '10': 'span 10 / span 10',
        '11': 'span 11 / span 11',
        '12': 'span 12 / span 12',
      },
    },
  }
  ```

## 0.46.0

### Patch Changes

- fix: use sizing tokens for flexBasis instead of spacing tokens
  - @pandacss/types@0.46.0

## 0.42.0

### Minor Changes

- Ensure classnames are unique across utilities to prevent potential clash
  - Add support for `4xl` border radius token

## 0.39.0

### Minor Changes

- **BREAKING 💥**

  Remove `linkBox` pattern in favor of using adding `position: relative` when using the `linkOverlay` pattern.

  **Before**

  ```jsx
  import { linkBox, linkOverlay } from 'styled-system/patterns'

  const App = () => {
    return (
      <div className={linkBox()}>
        <img src="https://via.placeholder.com/150" alt="placeholder" />
        <a href="#" className={linkOverlay()}>
          Link
        </a>
      </div>
    )
  }
  ```

  **After**

  ```jsx
  import { css } from 'styled-system/css'
  import { linkOverlay } from 'styled-system/patterns'

  const App = () => {
    return (
      <div className={css({ pos: 'relative' })}>
        <img src="https://via.placeholder.com/150" alt="placeholder" />
        <a href="#" className={linkOverlay()}>
          Link
        </a>
      </div>
    )
  }
  ```

### Patch Changes

- Fix issue where `float` property did not allow inherited values (auto, initial, none, etc.)
- Fix issue where `animationName` property was not connected to `theme.keyframes`, as a result, no autocompletion was
  available.

## 0.37.0

### Minor Changes

- ### Fixed

  - Fix className collisions between utilities by using unique class names per property in the default preset.

  ### Changed

  - **Color Mode Selectors**: Changed the default selectors for `_light` and `_dark` to target parent elements. This
    ensures consistent behavior with using these conditions to style pseudo elements (like `::before` and `::after`).

  ```diff
  const conditions = {
  -  _dark: '&.dark, .dark &',
  +  _dark: '.dark &',
  -  _light: '&.light, .light &',
  +  _light: '.light &',
  }
  ```

  - Changed `divideX` and `divideY` now maps to the `borderWidths` token group.

  ### Added

  - **Spacing Utilities**: Add new `spaceX` and `spaceY` utilities for applying margin between elements. Especially
    useful when applying negative margin to child elements.

  ```tsx
  <div className={flex({ spaceX: '-1' })}>
    <div className={circle({ size: '5', bg: 'red' })} />
    <div className={circle({ size: '5', bg: 'pink' })} />
  </div>
  ```

  - Added new `_starting` condition to support the new `@starting-style` at-rule.
    [Learn more here](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)
  - **Gradient Position**: Add new `gradientFromPosition` and `gradientToPosition` utilities for controlling the
    position of the gradient color stops.

  ```tsx
  <div
    className={css({
      bgGradient: 'to-r',
      // from
      gradientFrom: 'red',
      gradientFromPosition: 'top left',
      // to
      gradientTo: 'blue',
      gradientToPosition: 'bottom right',
    })}
  />
  ```

## 0.33.0

### Patch Changes

- Add a `group` to every utility in the `@pandacss/preset-base`, this helps Panda tooling organize utilities.

## 0.31.0

### Minor Changes

- Add `textShadowColor` utility

  ```ts
  css({
    textShadow: '1px 1px 1px var(--text-shadow-color)',
    textShadowColor: 'black',
  })
  ```

## 0.29.0

### Minor Changes

- Update every utilities connected to the `colors` tokens in the `@pandacss/preset-base` (included by default) to use
  the [`color-mix`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) CSS function.

  This function allows you to mix two colors together, and we use it to change the opacity of a color using the
  `{color}/{opacity}` syntax.

  You can use it like this:

  ```ts
  css({
    bg: 'red.300/40',
    color: 'white',
  })
  ```

  This will generate:

  ```css
  @layer utilities {
    .bg_red\.300\/40 {
      --mix-background: color-mix(in srgb, var(--colors-red-300) 40%, transparent);
      background: var(--mix-background, var(--colors-red-300));
    }

    .text_white {
      color: var(--colors-white);
    }
  }
  ```

  - If you're not using any opacity, the utility will not use `color-mix`
  - The utility will automatically fallback to the original color if the `color-mix` function is not supported by the
    browser.
  - You can use any of the color tokens, and any of the opacity tokens.

  ***

  The `utilities` transform function also receives a new `utils` object that contains the `colorMix` function, so you
  can also use it on your own utilities:

  ```ts
  export default defineConfig({
    utilities: {
      background: {
        shorthand: 'bg',
        className: 'bg',
        values: 'colors',
        transform(value, args) {
          const mix = args.utils.colorMix(value)
          // This can happen if the value format is invalid (e.g. `bg: red.300/invalid` or `bg: red.300//10`)
          if (mix.invalid) return { background: value }

          return {
            background: mix.value,
          }
        },
      },
    },
  })
  ```

  ***

  Here's a cool snippet (that we use internally !) that makes it easier to create a utility transform for a given
  property:

  ```ts
  import type { PropertyTransform } from '@pandacss/types'

  export const createColorMixTransform =
    (prop: string): PropertyTransform =>
    (value, args) => {
      const mix = args.utils.colorMix(value)
      if (mix.invalid) return { [prop]: value }

      const cssVar = '--mix-' + prop

      return {
        [cssVar]: mix.value,
        [prop]: `var(${cssVar}, ${mix.color})`,
      }
    }
  ```

  then the same utility transform as above can be written like this:

  ```ts
  export default defineConfig({
    utilities: {
      background: {
        shorthand: "bg",
        className: "bg",
        values: "colors",
        transform: createColorMixTransform("background"),
    },
  });
  ```

- ### Container Query Theme

  Improve support for CSS container queries by adding a new `containerNames` and `containerSizes` theme options.

  You can new define container names and sizes in your theme configuration and use them in your styles.

  ```ts
  export default defineConfig({
    // ...
    theme: {
      extend: {
        containerNames: ['sidebar', 'content'],
        containerSizes: {
          xs: '40em',
          sm: '60em',
          md: '80em',
        },
      },
    },
  })
  ```

  The default container sizes in the `@pandacss/preset-panda` preset are shown below:

  ```ts
  export const containerSizes = {
    xs: '320px',
    sm: '384px',
    md: '448px',
    lg: '512px',
    xl: '576px',
    '2xl': '672px',
    '3xl': '768px',
    '4xl': '896px',
    '5xl': '1024px',
    '6xl': '1152px',
    '7xl': '1280px',
    '8xl': '1440px',
  }
  ```

  Then use them in your styles by referencing using `@<container-name>/<container-size>` syntax:

  > The default container syntax is `@/<container-size>`.

  ```ts
  import { css } from '/styled-system/css'

  function Demo() {
    return (
      <nav className={css({ containerType: 'inline-size' })}>
        <div
          className={css({
            fontSize: { '@/sm': 'md' },
          })}
        />
      </nav>
    )
  }
  ```

  This will generate the following CSS:

  ```css
  .cq-type_inline-size {
    container-type: inline-size;
  }

  @container (min-width: 60em) {
    .\@\/sm:fs_md {
      container-type: inline-size;
    }
  }
  ```

  ### Container Query Pattern

  To make it easier to use container queries, we've added a new `cq` pattern to `@pandacss/preset-base`.

  ```ts
  import { cq } from 'styled-system/patterns'

  function Demo() {
    return (
      <nav className={cq()}>
        <div
          className={css({
            fontSize: { base: 'lg', '@/sm': 'md' },
          })}
        />
      </nav>
    )
  }
  ```

  You can also named container queries:

  ```ts
  import { cq } from 'styled-system/patterns'

  function Demo() {
    return (
      <nav className={cq({ name: 'sidebar' })}>
        <div
          className={css({
            fontSize: { base: 'lg', '@sidebar/sm': 'md' },
          })}
        />
      </nav>
    )
  }
  ```

- Updated the default preset in Panda to use the new `defaultValues` feature.

  To override the default values, consider using the `extend` pattern.

  ```js
  defineConfig({
    patterns: {
      extend: {
        stack: {
          defaultValues: { gap: '20px' },
        },
      },
    },
  })
  ```

## 0.27.0

### Minor Changes

- Improve performance, mostly for the CSS generation by removing a lot of `postcss` usage (and plugins).

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

- Add support for aspect ratio tokens in the panda config or preset. Aspect ratio tokens are used to define the aspect
  ratio of an element.

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

## 0.26.2

### Patch Changes

- Fix `placeholder` condition in `preset-base`
  - @pandacss/types@0.26.2

## 0.26.0

### Patch Changes

- Add `data-placeholder` and `data-placeholder-shown` conditions

## 0.22.0

### Patch Changes

- Fixes a missing bracket in \_indeterminate condition

## 0.20.1

### Patch Changes

- Added `strokeWidth` to svg utilities.
  - Connected `outlineWidth` utility to `borderWidths` token.
  - Add `borderWidth`, `borderTopWidth`, `borderLeftWidth`, `borderRightWidth`, `borderBottomWidth` to border utilities.
  - @pandacss/types@0.20.1

## 0.18.2

### Patch Changes

- Fix regression in grid pattern where `columns` doesn't not work as expected.
  - @pandacss/types@0.18.2

## 0.18.1

### Patch Changes

- Make `_required` target `[data-required]` and `[aria-required=true]` attributes
- Fix an issue with the `grid` pattern from @pandacss/preset-base (included by default), setting a minChildWidth wasn't
  interpreted as a token value

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

  - @pandacss/types@0.18.1

## 0.16.0

### Patch Changes

- Add closed condition `&:is([closed], [data-closed], [data-state="closed"])`
  - @pandacss/types@0.16.0

## 0.12.0

### Patch Changes

- Add `animationName` utility
  - @pandacss/types@0.12.0

## 0.11.0

### Minor Changes

- Add new visually hidden and bleed patterns.

  ### Bleed

  Bleed is a layout pattern is used to negate the padding applied to a parent container. You can apply an `inline` or
  `block` bleed to a child element, setting its value to match the parent's padding.

  ```tsx
  import { css } from '../styled-system/css'
  import { bleed } from '../styled-system/patterns'

  export function Page() {
    return (
      <div class={css({ px: '6' })}>
        <div class={bleed({ inline: '6' })}>Welcome</div>
      </div>
    )
  }
  ```

  ### Visually Hidden

  Visually hidden is a layout pattern used to hide content visually, but still make it available to screen readers.

  ```tsx
  import { css } from '../styled-system/css'
  import { visuallyHidden } from '../styled-system/patterns'

  export function Checkbox() {
    return (
      <label>
        <input type="checkbox" class={visuallyHidden()}>
          I'm hidde
        </input>
        <span>Checkbox</span>
      </label>
    )
  }
  ```

## 0.10.0

### Patch Changes

- Update conditions
- Add opacity utility to base preset

## 0.9.0

### Minor Changes

- ### Breaking

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

## 0.8.0

### Patch Changes

- Fix parser issue with TS path mappings

## 0.7.0

### Minor Changes

- Refactor `transition` utility to improve DX of adding transition. Transitions will now add a default transition
  property, timing function and duration. This allows you to add transitions with a single property.

  ```jsx
  <div className={css({ transition: 'background' })}>Content</div>
  ```

  This will generate the following css:

  ```css
  .transition_background {
    transition-property: background, background-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }
  ```

### Patch Changes

- Fix issue where `zIndex` tokens are not connected to zIndex utility

## 0.6.0

### Minor Changes

- Add negative fraction values to `translateX` and `translateY` utilities

### Patch Changes

- Fix issue where `gridRows` has the wrong `className`

  - Fix issue where `gridItem` pattern did not use the `colStart` and `rowStart` values

- Fix issue where `_even` and `_odd` map to incorrect selectors
  - @pandacss/types@0.6.0

## 0.4.0

### Patch Changes

- Fix issue here divider pattern generated incorrect css in horizontal orientation
- Add `auto` value where neccessary to base utilities.
- Fix placeholder condition to map to `&::placeholder`
- Fix issue where patterns that include css selectors doesn't work in JSX
- Add polyfill for common properties to reduce the need for autoprefixer

## 0.3.1

### Patch Changes

- Baseline release for the launch

## 0.3.0

### Patch Changes

- Initial release
