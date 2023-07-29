# @pandacss/fixture

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
  - @pandacss/preset-base@0.9.0
  - @pandacss/types@0.9.0
  - @pandacss/preset-panda@0.9.0

## 0.8.0

### Patch Changes

- Updated dependencies [be0ad578]
  - @pandacss/preset-base@0.8.0
  - @pandacss/types@0.8.0
  - @pandacss/preset-panda@0.8.0

## 0.7.0

### Patch Changes

- Updated dependencies [60a77841]
- Updated dependencies [a9c189b7]
- Updated dependencies [d9eeba60]
  - @pandacss/preset-base@0.7.0
  - @pandacss/types@0.7.0
  - @pandacss/preset-panda@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [97fbe63f]
- Updated dependencies [08d33e0f]
- Updated dependencies [f7aff8eb]
  - @pandacss/preset-base@0.6.0
  - @pandacss/types@0.6.0
  - @pandacss/preset-panda@0.6.0

## 0.5.1

### Patch Changes

- Updated dependencies [8c670d60]
- Updated dependencies [1ed239cd]
- Updated dependencies [78ed6ed4]
  - @pandacss/types@0.5.1
  - @pandacss/preset-base@0.5.1
  - @pandacss/preset-panda@0.5.1

## 0.5.0

### Patch Changes

- Updated dependencies [ead9eaa3]
- Updated dependencies [3a87cff8]
  - @pandacss/types@0.5.0
  - @pandacss/preset-panda@0.5.0
  - @pandacss/preset-base@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [e8024347]
- Updated dependencies [d00eb17c]
- Updated dependencies [9156c1c6]
- Updated dependencies [54a8913c]
- Updated dependencies [0f36ebad]
- Updated dependencies [c7b42325]
- Updated dependencies [5b344b9c]
  - @pandacss/preset-base@0.4.0
  - @pandacss/types@0.4.0
  - @pandacss/preset-panda@0.4.0

## 0.3.2

### Patch Changes

- @pandacss/preset-base@0.3.2
- @pandacss/preset-panda@0.3.2
- @pandacss/types@0.3.2

## 0.3.1

### Patch Changes

- efd79d83: Baseline release for the launch
- Updated dependencies [efd79d83]
  - @pandacss/preset-base@0.3.1
  - @pandacss/preset-panda@0.3.1
  - @pandacss/types@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies [bd5c049b]
- Updated dependencies [6d81ee9e]
  - @pandacss/preset-base@0.3.0
  - @pandacss/preset-panda@0.3.0
  - @pandacss/types@0.3.0
