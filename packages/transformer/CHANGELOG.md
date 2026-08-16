# @pandacss/transformer

## 2.0.0-beta.14

### Patch Changes

- Updated dependencies [10014b4]
- Updated dependencies [a4f3944]
- Updated dependencies [9bcdcb0]
- Updated dependencies [ef7ffc7]
- Updated dependencies [6bcc885]
  - @pandacss/compiler@2.0.0-beta.14
  - @pandacss/compiler-shared@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- Updated dependencies [b621edb]
  - @pandacss/compiler@2.0.0-beta.13
  - @pandacss/compiler-shared@2.0.0-beta.13

## 2.0.0-beta.12

### Patch Changes

- 43940f7: Speed up transformed components that pass a `className` through. `cx` now returns a lone class string as-is
  instead of re-tokenizing it, which is the common case for elements the transform folds past a spread.
- 1e3654b: Fix boolean variants in transformed source. `cva`/`sva` now resolve `{ true: … }` branches for boolean and
  numeric values, including boolean `defaultVariants`, instead of matching only string values.
- e80f6d0: Memoize `cva`/`sva` results in transformed source, so a component re-rendering with the same variant props
  reuses its class string instead of rebuilding it.
- 50d2c99: Fix `styled(Component, styles)` chains crashing with `cvaA.merge is not a function` when the transform is
  enabled. The internal recipe runtime now implements `merge`, so a chain collapses to one composed recipe at definition
  time as it does untransformed.
- cdf6293: Speed up recipes in transformed source. `cva` now resolves through a precomputed table of class strings
  instead of rebuilding a memo key on every call.
- Updated dependencies [172c52f]
- Updated dependencies [98aaa76]
- Updated dependencies [ceb8d8d]
- Updated dependencies [28ee00a]
- Updated dependencies [604b103]
- Updated dependencies [25137db]
- Updated dependencies [c2fcd98]
- Updated dependencies [8ccb118]
- Updated dependencies [fad2f12]
- Updated dependencies [736358d]
- Updated dependencies [28ee00a]
  - @pandacss/compiler@2.0.0-beta.12
  - @pandacss/compiler-shared@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- Updated dependencies [c7f949a]
  - @pandacss/compiler@2.0.0-beta.11
  - @pandacss/compiler-shared@2.0.0-beta.11

## 2.0.0-beta.10

### Patch Changes

- Updated dependencies [05e085d]
- Updated dependencies [05e085d]
- Updated dependencies [d2bea8a]
- Updated dependencies [f8027f3]
- Updated dependencies [ebe9f5b]
- Updated dependencies [05e085d]
- Updated dependencies [52e84e6]
- Updated dependencies [05e085d]
- Updated dependencies [5c060e7]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/compiler-shared@2.0.0-beta.10
  - @pandacss/compiler@2.0.0-beta.10
