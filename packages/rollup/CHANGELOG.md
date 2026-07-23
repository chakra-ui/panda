# @pandacss/rollup

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
