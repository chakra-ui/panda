# @pandacss/preset-typography

## 2.0.0-beta.17

### Patch Changes

- Updated dependencies [5b9a056]
- Updated dependencies [1ca20ab]
  - @pandacss/types@2.0.0-beta.17

## 2.0.0-beta.16

### Patch Changes

- 4943d03: Make the `prose` recipe scale with its container and follow the page.

  - A size sets one root font size; every element is an `em` ratio of it. Set `--prose-leading` and `--prose-flow` on
    the wrapper to tune line height and block spacing.
  - Inherit the page font instead of forcing `sans`. Only `code`, `pre`, and `kbd` use `mono`.
  - Space blocks from the top only, with no `:last-child` rules, so streamed content never restyles earlier blocks.
  - Render inline code as a pill on the new `codeBg` color role, and code blocks as a theme surface instead of an
    always-dark panel.

- Updated dependencies [dea1ef5]
- Updated dependencies [c58d45d]
- Updated dependencies [ef14fc5]
  - @pandacss/types@2.0.0-beta.16

## 2.0.0-beta.15

### Patch Changes

- Updated dependencies [ec65db3]
- Updated dependencies [02bd0ad]
- Updated dependencies [e18eeb3]
- Updated dependencies [2d5d152]
  - @pandacss/types@2.0.0-beta.15

## 2.0.0-beta.14

### Patch Changes

- @pandacss/types@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- @pandacss/types@2.0.0-beta.13

## 2.0.0-beta.12

### Patch Changes

- @pandacss/types@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- @pandacss/types@2.0.0-beta.11

## 2.0.0-beta.10

### Minor Changes

- 4e0f137: Add `@pandacss/preset-typography` for prose-styled Markdown and CMS HTML.

  Opt in with `presets: [typographyPreset()]` to get a `prose` recipe (size variants) and semantic color tokens with
  dark-mode defaults.

### Patch Changes

- Updated dependencies [52e84e6]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/types@2.0.0-beta.10
