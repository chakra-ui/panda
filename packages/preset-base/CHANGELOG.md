# @pandacss/preset-base

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
