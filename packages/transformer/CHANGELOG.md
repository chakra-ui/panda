# @pandacss/transformer

## 2.0.0-beta.17

### Patch Changes

- Updated dependencies [597d2cb]
- Updated dependencies [597d2cb]
- Updated dependencies [5b9a056]
- Updated dependencies [8d29caa]
- Updated dependencies [323af68]
- Updated dependencies [55cab2b]
- Updated dependencies [bb47c38]
- Updated dependencies [774529f]
- Updated dependencies [e82613b]
  - @pandacss/compiler-shared@2.0.0-beta.17
  - @pandacss/compiler@2.0.0-beta.17

## 2.0.0-beta.16

### Minor Changes

- 064e58f: Source transforms now handle slot recipes.

  - `tabs({ size: 'sm' })` on a config slot recipe becomes an object of class strings, one per slot.
  - Inline `sva()` compiles even when variants style each slot differently.
  - Defaults, compound variants and finite conditionals fold; dynamic and responsive values stay on the runtime.
  - Fix transformed recipe classes ignoring `prefix` and `hash`.
  - Fix boolean compound variants in inline `cva()` / `sva()` never matching.
  - Add `transform_source` spans to `--profile` output.

### Patch Changes

- 446210a: Mark transformed `cva()`, `sva()`, and `styled()` recipe factories as pure so bundlers can remove unused
  definitions and their runtime helpers.
- Updated dependencies [f583fb9]
- Updated dependencies [6b04d94]
- Updated dependencies [dfb17b2]
- Updated dependencies [84720fc]
- Updated dependencies [d94d26c]
- Updated dependencies [c3702af]
- Updated dependencies [dea1ef5]
- Updated dependencies [a46ecb4]
- Updated dependencies [ca9bb58]
- Updated dependencies [c58d45d]
- Updated dependencies [446210a]
- Updated dependencies [9bdafba]
- Updated dependencies [f583fb9]
- Updated dependencies [b2294ca]
- Updated dependencies [af261f5]
- Updated dependencies [9da80e1]
- Updated dependencies [ef14fc5]
- Updated dependencies [064e58f]
- Updated dependencies [ef68d33]
- Updated dependencies [bcbcb22]
  - @pandacss/compiler@2.0.0-beta.16
  - @pandacss/compiler-shared@2.0.0-beta.16

## 2.0.0-beta.15

### Patch Changes

- Updated dependencies [8b43347]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [7c8a215]
- Updated dependencies [8885864]
- Updated dependencies [e18eeb3]
  - @pandacss/compiler@2.0.0-beta.15
  - @pandacss/compiler-shared@2.0.0-beta.15

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
