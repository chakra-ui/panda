# @pandacss/reporter

## 1.1.0

### Patch Changes

- Updated dependencies [47a0011]
- Updated dependencies [e8ec0aa]
  - @pandacss/types@1.1.0
  - @pandacss/shared@1.1.0
  - @pandacss/core@1.1.0
  - @pandacss/generator@1.1.0
  - @pandacss/logger@1.1.0

## 1.0.1

### Patch Changes

- Updated dependencies [d236e21]
  - @pandacss/generator@1.0.1
  - @pandacss/core@1.0.1
  - @pandacss/logger@1.0.1
  - @pandacss/shared@1.0.1
  - @pandacss/types@1.0.1

## 1.0.0

### Major Changes

- a3bcbea: Stable release of PandaCSS

  ### Style Context

  Add `createStyleContext` function to framework artifacts for React, Preact, Solid, and Vue frameworks

  ```tsx
  import { sva } from 'styled-system/css'
  import { createStyleContext } from 'styled-system/jsx'

  const card = sva({
    slots: ['root', 'label'],
    base: {
      root: {
        color: 'red',
        bg: 'red.300',
      },
      label: {
        fontWeight: 'medium',
      },
    },
    variants: {
      size: {
        sm: {
          root: {
            padding: '10px',
          },
        },
        md: {
          root: {
            padding: '20px',
          },
        },
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  })

  const { withProvider, withContext } = createStyleContext(card)

  const CardRoot = withProvider('div', 'root')
  const CardLabel = withContext('label', 'label')
  ```

  Then, use like this:

  ```tsx
  <CardRoot size="sm">
    <CardLabel>Hello</CardLabel>
  </CardRoot>
  ```

### Patch Changes

- Updated dependencies [a3bcbea]
- Updated dependencies [a20811c]
  - @pandacss/core@1.0.0
  - @pandacss/generator@1.0.0
  - @pandacss/logger@1.0.0
  - @pandacss/shared@1.0.0
  - @pandacss/types@1.0.0

## 0.54.0

### Patch Changes

- Updated dependencies [efa060d]
- Updated dependencies [941a208]
- Updated dependencies [d2aede5]
- Updated dependencies [fdf5142]
  - @pandacss/shared@0.54.0
  - @pandacss/generator@0.54.0
  - @pandacss/core@0.54.0
  - @pandacss/types@0.54.0
  - @pandacss/logger@0.54.0

## 0.53.7

### Patch Changes

- Updated dependencies [5e5af6b]
- Updated dependencies [9453c9b]
- Updated dependencies [a67f920]
  - @pandacss/core@0.53.7
  - @pandacss/generator@0.53.7
  - @pandacss/logger@0.53.7
  - @pandacss/shared@0.53.7
  - @pandacss/types@0.53.7

## 0.53.6

### Patch Changes

- Updated dependencies [a292e9a]
  - @pandacss/generator@0.53.6
  - @pandacss/core@0.53.6
  - @pandacss/logger@0.53.6
  - @pandacss/shared@0.53.6
  - @pandacss/types@0.53.6

## 0.53.5

### Patch Changes

- Updated dependencies [fe3e943]
  - @pandacss/generator@0.53.5
  - @pandacss/core@0.53.5
  - @pandacss/logger@0.53.5
  - @pandacss/shared@0.53.5
  - @pandacss/types@0.53.5

## 0.53.4

### Patch Changes

- Updated dependencies [57343c1]
- Updated dependencies [a2bc49d]
  - @pandacss/core@0.53.4
  - @pandacss/generator@0.53.4
  - @pandacss/logger@0.53.4
  - @pandacss/shared@0.53.4
  - @pandacss/types@0.53.4

## 0.53.3

### Patch Changes

- Updated dependencies [00aa868]
  - @pandacss/generator@0.53.3
  - @pandacss/core@0.53.3
  - @pandacss/logger@0.53.3
  - @pandacss/shared@0.53.3
  - @pandacss/types@0.53.3

## 0.53.2

### Patch Changes

- @pandacss/core@0.53.2
- @pandacss/generator@0.53.2
- @pandacss/logger@0.53.2
- @pandacss/shared@0.53.2
- @pandacss/types@0.53.2

## 0.53.1

### Patch Changes

- @pandacss/core@0.53.1
- @pandacss/generator@0.53.1
- @pandacss/logger@0.53.1
- @pandacss/shared@0.53.1
- @pandacss/types@0.53.1

## 0.53.0

### Patch Changes

- Updated dependencies [5286731]
  - @pandacss/generator@0.53.0
  - @pandacss/types@0.53.0
  - @pandacss/core@0.53.0
  - @pandacss/logger@0.53.0
  - @pandacss/shared@0.53.0

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
