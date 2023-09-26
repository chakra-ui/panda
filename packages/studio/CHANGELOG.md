# @pandacss/studio

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
