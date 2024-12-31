# @pandacss/reporter

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
