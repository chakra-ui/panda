# @pandacss/eslint-plugin

## 2.0.0-beta.8

### Patch Changes

- Updated dependencies [72580e5]
  - @pandacss/compiler-shared@2.0.0-beta.8
  - @pandacss/compiler@2.0.0-beta.8
  - @pandacss/config@2.0.0-beta.8

## 2.0.0-beta.7

### Patch Changes

- Updated dependencies [97d142a]
- Updated dependencies [0a11fda]
  - @pandacss/compiler@2.0.0-beta.7
  - @pandacss/compiler-shared@2.0.0-beta.7
  - @pandacss/config@2.0.0-beta.7

## 2.0.0-beta.6

### Patch Changes

- Updated dependencies [8a936bd]
- Updated dependencies [82e7811]
- Updated dependencies [b5a620d]
- Updated dependencies [7b71a43]
- Updated dependencies [d075c2b]
- Updated dependencies [86504d6]
  - @pandacss/compiler@2.0.0-beta.6
  - @pandacss/compiler-shared@2.0.0-beta.6
  - @pandacss/config@2.0.0-beta.6

## 2.0.0-beta.5

### Patch Changes

- Updated dependencies [a9c6e47]
  - @pandacss/compiler@2.0.0-beta.5
  - @pandacss/compiler-shared@2.0.0-beta.5
  - @pandacss/config@2.0.0-beta.5

## 2.0.0-beta.4

### Patch Changes

- 23580df: Add the ESLint plugin core (settings, project caching, inspection caching, source range lookup), the first
  Panda lint rules (`extraction-diagnostics`, `file-not-included`, `no-invalid-token-paths`, `no-debug`, a consolidated
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

- Updated dependencies [9521059]
- Updated dependencies [74dab7b]
- Updated dependencies [0202dba]
- Updated dependencies [23580df]
- Updated dependencies [5316642]
- Updated dependencies [1378d4a]
  - @pandacss/compiler@2.0.0-beta.4
  - @pandacss/compiler-shared@2.0.0-beta.4
  - @pandacss/config@2.0.0-beta.4
