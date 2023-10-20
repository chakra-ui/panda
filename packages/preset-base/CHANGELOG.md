# @pandacss/preset-base

## 0.17.0

### Patch Changes

- Updated dependencies [fc4688e6]
  - @pandacss/types@0.17.0

## 0.16.0

### Patch Changes

- 0f3bede5: Add closed condition `&:is([closed], [data-closed], [data-state="closed"])`
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

- bf2ff391: Add `animationName` utility
  - @pandacss/types@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [23b516f4]
  - @pandacss/types@0.11.1

## 0.11.0

### Minor Changes

- 811f4fb1: Add new visually hidden and bleed patterns.

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

### Patch Changes

- Updated dependencies [5b95caf5]
  - @pandacss/types@0.11.0

## 0.10.0

### Patch Changes

- 00d11a8b: Update conditions
- 1972b4fa: Add opacity utility to base preset
- Updated dependencies [24e783b3]
- Updated dependencies [386e5098]
- Updated dependencies [a669f4d5]
  - @pandacss/types@0.10.0

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

## 0.8.0

### Patch Changes

- be0ad578: Fix parser issue with TS path mappings
- Updated dependencies [be0ad578]
  - @pandacss/types@0.8.0

## 0.7.0

### Minor Changes

- 60a77841: Refactor `transition` utility to improve DX of adding transition. Transitions will now add a default
  transition property, timing function and duration. This allows you to add transitions with a single property.

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

- d9eeba60: Fix issue where `zIndex` tokens are not connected to zIndex utility
- Updated dependencies [a9c189b7]
  - @pandacss/types@0.7.0

## 0.6.0

### Minor Changes

- 97fbe63f: Add negative fraction values to `translateX` and `translateY` utilities

### Patch Changes

- 08d33e0f: - Fix issue where `gridRows` has the wrong `className`

  - Fix issue where `gridItem` pattern did not use the `colStart` and `rowStart` values

- f7aff8eb: Fix issue where `_even` and `_odd` map to incorrect selectors
  - @pandacss/types@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [ead9eaa3]
  - @pandacss/types@0.5.0

## 0.4.0

### Patch Changes

- e8024347: Fix issue here divider pattern generated incorrect css in horizontal orientation
- d00eb17c: Add `auto` value where neccessary to base utilities.
- 9156c1c6: Fix placeholder condition to map to `&::placeholder`
- 54a8913c: Fix issue where patterns that include css selectors doesn't work in JSX
- 0f36ebad: Add polyfill for common properties to reduce the need for autoprefixer
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
