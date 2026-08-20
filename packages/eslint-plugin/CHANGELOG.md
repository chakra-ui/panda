# @pandacss/eslint-plugin

## 2.0.0-beta.15

### Patch Changes

- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [7c8a215]
- Updated dependencies [8885864]
- Updated dependencies [e18eeb3]
- Updated dependencies [2d5d152]
  - @pandacss/compiler@2.0.0-beta.15
  - @pandacss/config@2.0.0-beta.15
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
  - @pandacss/config@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- Updated dependencies [b621edb]
  - @pandacss/compiler@2.0.0-beta.13
  - @pandacss/compiler-shared@2.0.0-beta.13
  - @pandacss/config@2.0.0-beta.13

## 2.0.0-beta.12

### Patch Changes

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
  - @pandacss/config@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- Updated dependencies [c7f949a]
  - @pandacss/compiler@2.0.0-beta.11
  - @pandacss/compiler-shared@2.0.0-beta.11
  - @pandacss/config@2.0.0-beta.11

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
  - @pandacss/config@2.0.0-beta.10

## 2.0.0-beta.9

### Patch Changes

- Add `no-primitive-token` (and inspection metadata) so you can require semantic tokens when a matching category exists.

## 2.0.0-beta.4

### Patch Changes

- Add the ESLint plugin core (settings, project caching, inspection caching, source range lookup), the first Panda lint
  rules (`extraction-diagnostics`, `file-not-included`, `no-invalid-token-paths`, `no-debug`, a consolidated
  `no-deprecated` covering deprecated tokens, utilities, recipes, and patterns — with the author's deprecation message
  and a `kinds` option, and `prefer-token`, which flags raw values where a token exists and tells you the token to use
  (semantic tokens preferred, value forms normalized) across every style-writing form — `css()`, style props, responsive
  arrays, per-prop conditions, and `cva`/`sva`/`styled` recipe styles — with a per-leaf quick-fix; `recommended` scopes
  it to colors, replacing v1's `no-hardcoded-color`; plus `no-shorthand-longhand-mix`, which flags a shorthand mixed
  with one of its own longhands in the same block (`margin` + `marginLeft`) since the longhand wins regardless of source
  order; and `consistent-property-style`, an autofixable rule enforcing either Panda shorthand aliases (`ml`) or
  longhand canonical names (`marginLeft`) via `style: 'shorthand' | 'longhand'`; and `no-invalid-nesting` (recommended),
  which flags a nested selector missing `&` — e.g. `':hover'` instead of `'&:hover'` — that Panda silently ignores, and
  suggests the `&` prefix), and a `configs.recommended({ configPath })` flat-config entry with `@pandacss/*` rule ids.
  Config and compiler loading is preloaded once per project so rule visitors stay synchronous.

  The same rules also run under oxlint via the `@pandacss/eslint-plugin/oxlint` entry (oxlint's ESLint-compatible JS
  plugins).
