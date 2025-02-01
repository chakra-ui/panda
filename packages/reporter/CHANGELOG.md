# @pandacss/reporter

## 0.52.0

### Patch Changes

- @pandacss/core@0.52.0
- @pandacss/generator@0.52.0
- @pandacss/logger@0.52.0
- @pandacss/shared@0.52.0
- @pandacss/types@0.52.0

## 0.51.1

### Patch Changes

- 9c1327e: Redesigned the recipe report to be more readable and easier to understand. We simplified the `JSX` and
  `Function` columns to be more concise.

  **BEFORE**

  ```sh
  ╔════════════════════════╤══════════════════════╤═════════╤═══════╤════════════╤═══════════════════╤══════════╗
  ║ Recipe                 │ Variant Combinations │ Usage % │ JSX % │ Function % │ Most Used         │ Found in ║
  ╟────────────────────────┼──────────────────────┼─────────┼───────┼────────────┼───────────────────┼──────────╢
  ║ someRecipe (1 variant) │ 1 / 1                │ 100%    │ 100%  │ 0%         │ size.small        │ 1 file   ║
  ╟────────────────────────┼──────────────────────┼─────────┼───────┼────────────┼───────────────────┼──────────╢
  ║ button (4 variants)    │ 7 / 9                │ 77.78%  │ 63%   │ 38%        │ size.md, size.sm, │ 2 files  ║
  ║                        │                      │         │       │            │ state.focused,    │          ║
  ║                        │                      │         │       │            │ variant.danger,   │          ║
  ║                        │                      │         │       │            │ variant.primary   │          ║
  ╚════════════════════════╧══════════════════════╧═════════╧═══════╧════════════╧═══════════════════╧══════════╝
  ```

  **AFTER**

  ```sh
  ╔════════════════════════╤════════════════╤═══════════════════╤═══════════════════╤══════════╤═══════════╗
  ║ Recipe                 │ Variant values │ Usage %           │ Most used         │ Found in │ Used as   ║
  ╟────────────────────────┼────────────────┼───────────────────┼───────────────────┼──────────┼───────────╢
  ║ someRecipe (1 variant) │ 1 value        │ 100% (1 value)    │ size.small        │ 1 file   │ jsx: 100% ║
  ║                        │                │                   │                   │          │ fn: 0%    ║
  ╟────────────────────────┼────────────────┼───────────────────┼───────────────────┼──────────┼───────────╢
  ║ button (4 variants)    │ 9 values       │ 77.78% (7 values) │ size.md, size.sm, │ 2 files  │ jsx: 63%  ║
  ║                        │                │                   │ state.focused,    │          │ fn: 38%   ║
  ║                        │                │                   │ variant.danger,   │          │           ║
  ║                        │                │                   │ variant.primary   │          │           ║
  ╚════════════════════════╧════════════════╧═══════════════════╧═══════════════════╧══════════╧═══════════╝
  ```

  - @pandacss/core@0.51.1
  - @pandacss/generator@0.51.1
  - @pandacss/logger@0.51.1
  - @pandacss/shared@0.51.1
  - @pandacss/types@0.51.1

## 0.51.0

### Patch Changes

- Updated dependencies [d68ad1f]
  - @pandacss/types@0.51.0
  - @pandacss/core@0.51.0
  - @pandacss/generator@0.51.0
  - @pandacss/logger@0.51.0
  - @pandacss/shared@0.51.0

## 0.50.0

### Minor Changes

- fea78c7: Adds support for static analysis of used tokens and recipe variants. It helps to get a birds-eye view of how
  your design system is used and answers the following questions:

  - What tokens are most used?
  - What recipe variants are most used?
  - How many hardcoded values vs tokens do we have?

  ```sh
  panda analyze --scope=<token|recipe>
  ```

  > Still work in progress but we're excited to get your feedback!

### Patch Changes

- Updated dependencies [fea78c7]
- Updated dependencies [ad89b90]
- Updated dependencies [7c85ac7]
  - @pandacss/types@0.50.0
  - @pandacss/generator@0.50.0
  - @pandacss/core@0.50.0
  - @pandacss/logger@0.50.0
  - @pandacss/shared@0.50.0
