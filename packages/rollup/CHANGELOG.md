# @pandacss/rollup

## 2.0.0-beta.12

### Patch Changes

- Updated dependencies [172c52f]
- Updated dependencies [43940f7]
- Updated dependencies [98aaa76]
- Updated dependencies [ceb8d8d]
- Updated dependencies [1e3654b]
- Updated dependencies [e80f6d0]
- Updated dependencies [50d2c99]
- Updated dependencies [cdf6293]
- Updated dependencies [28ee00a]
- Updated dependencies [604b103]
- Updated dependencies [25137db]
- Updated dependencies [c2fcd98]
- Updated dependencies [8ccb118]
- Updated dependencies [fad2f12]
- Updated dependencies [736358d]
- Updated dependencies [28ee00a]
  - @pandacss/compiler@2.0.0-beta.12
  - @pandacss/transformer@2.0.0-beta.12
  - @pandacss/compiler-shared@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- Updated dependencies [c7f949a]
  - @pandacss/compiler@2.0.0-beta.11
  - @pandacss/transformer@2.0.0-beta.11
  - @pandacss/compiler-shared@2.0.0-beta.11

## 2.0.0-beta.10

### Minor Changes

- c7efa26: Source transforms stay behind `transform: true`. Vite rebuilds its transformer after a compiler reload, so
  HMR doesn't keep a stale rewriter. Rollup reports compiler diagnostics and fails the build on errors instead of
  emitting CSS quietly.

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
  - @pandacss/transformer@2.0.0-beta.10
