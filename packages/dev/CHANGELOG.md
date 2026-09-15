# @pandacss/dev

## 2.0.0-beta.17

### Major Changes

- 1ca20ab: Remove `defineParts` and the `Parts` / `Part` types. Write the part selectors directly in your recipe, or use
  `defineSlotRecipe` for a class per part.

  If you still want the helper, it's a few lines you can keep in your own config:

  ```ts
  const defineParts =
    <T extends Record<string, { selector: string }>>(parts: T) =>
    (config: Partial<Record<keyof T, SystemStyleObject>>): SystemStyleObject =>
      Object.fromEntries(Object.entries(config).map(([key, value]) => [parts[key].selector, value]))
  ```

### Minor Changes

- 5b9a056: Add `firstThatWorks()` for ordered CSS value fallbacks, so one property can carry a modern value and a
  supported one:

  ```ts
  import { css, firstThatWorks } from 'styled-system/css'

  css({ color: firstThatWorks('oklch(55% 0.18 250)', '#0057b8') })
  ```

  ```css
  .c_firstThatWorks\(oklch\(55\%_0\.18_250\)\,_\#0057b8\) {
    color: #0057b8;
    color: oklch(55% 0.18 250);
  }
  ```

  Write the value you want first, as in StyleX. Members are typed by the property they sit in, so they autocomplete and
  `strictTokens` still applies. Config recipes import `firstThatWorks` from `@pandacss/dev`, or write the
  `firstThatWorks(a, b)` value form directly.

### Patch Changes

- Updated dependencies [597d2cb]
- Updated dependencies [597d2cb]
- Updated dependencies [5b9a056]
- Updated dependencies [1ca20ab]
- Updated dependencies [8d29caa]
- Updated dependencies [323af68]
- Updated dependencies [55cab2b]
- Updated dependencies [bb47c38]
- Updated dependencies [774529f]
- Updated dependencies [e82613b]
- Updated dependencies [597d2cb]
  - @pandacss/cli@2.0.0-beta.17
  - @pandacss/compiler@2.0.0-beta.17
  - @pandacss/types@2.0.0-beta.17
  - @pandacss/config@2.0.0-beta.17
  - @pandacss/postcss@2.0.0-beta.17

## 2.0.0-beta.16

### Minor Changes

- f3f5847: Add a `defineConditions` helper so custom conditions get the same typed authoring experience as tokens,
  recipes, and the other config blocks.

  ```ts
  import { defineConditions } from '@pandacss/dev'

  export const conditions = defineConditions({
    hover: '&:is(:hover, [data-hover])',
  })
  ```

- 729ce72: Add the `definePositionTry` config helper for authoring `theme.positionTry` fallbacks outside `defineConfig`,
  matching `defineViewTransitions`.

### Patch Changes

- Updated dependencies [80e62a1]
- Updated dependencies [ce90eda]
- Updated dependencies [b9e7cd9]
- Updated dependencies [a5bab14]
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
  - @pandacss/cli@2.0.0-beta.16
  - @pandacss/config@2.0.0-beta.16
  - @pandacss/compiler@2.0.0-beta.16
  - @pandacss/types@2.0.0-beta.16
  - @pandacss/postcss@2.0.0-beta.16

## 2.0.0-beta.15

### Minor Changes

- e18eeb3: Add `theme.viewTransitions` so a preset can name shared view-transition bags. Call `viewTransition('slide')`
  and Panda inlines `"vt_slide"`. Unused names stay out of the CSS.

### Patch Changes

- Updated dependencies [8b43347]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [ec65db3]
- Updated dependencies [02bd0ad]
- Updated dependencies [ec65db3]
- Updated dependencies [7c8a215]
- Updated dependencies [8885864]
- Updated dependencies [e18eeb3]
- Updated dependencies [2d5d152]
  - @pandacss/compiler@2.0.0-beta.15
  - @pandacss/types@2.0.0-beta.15
  - @pandacss/config@2.0.0-beta.15
  - @pandacss/cli@2.0.0-beta.15
  - @pandacss/postcss@2.0.0-beta.15

## 2.0.0-beta.14

### Patch Changes

- aa5ca7d: Fix `defineParts` returning an untyped object, which made the result unassignable to `base` or `variants` in
  `defineRecipe`.
- Updated dependencies [10014b4]
- Updated dependencies [a4f3944]
- Updated dependencies [9bcdcb0]
- Updated dependencies [ef7ffc7]
- Updated dependencies [6bcc885]
  - @pandacss/compiler@2.0.0-beta.14
  - @pandacss/cli@2.0.0-beta.14
  - @pandacss/postcss@2.0.0-beta.14
  - @pandacss/config@2.0.0-beta.14
  - @pandacss/types@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- Updated dependencies [b621edb]
  - @pandacss/compiler@2.0.0-beta.13
  - @pandacss/cli@2.0.0-beta.13
  - @pandacss/postcss@2.0.0-beta.13
  - @pandacss/config@2.0.0-beta.13
  - @pandacss/types@2.0.0-beta.13

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
  - @pandacss/cli@2.0.0-beta.12
  - @pandacss/postcss@2.0.0-beta.12
  - @pandacss/config@2.0.0-beta.12
  - @pandacss/types@2.0.0-beta.12

## 2.0.0-beta.11

### Patch Changes

- Updated dependencies [c7f949a]
  - @pandacss/compiler@2.0.0-beta.11
  - @pandacss/cli@2.0.0-beta.11
  - @pandacss/postcss@2.0.0-beta.11
  - @pandacss/config@2.0.0-beta.11
  - @pandacss/types@2.0.0-beta.11

## 2.0.0-beta.10

### Patch Changes

- adc2142: Fold `panda info` into `panda doctor`. Doctor now prints the project summary and remains the pass/fail health
  check; `panda info` is removed.
- Updated dependencies [adc2142]
- Updated dependencies [2fa2373]
- Updated dependencies [05e085d]
- Updated dependencies [05e085d]
- Updated dependencies [d2bea8a]
- Updated dependencies [f8027f3]
- Updated dependencies [ebe9f5b]
- Updated dependencies [05e085d]
- Updated dependencies [52e84e6]
- Updated dependencies [05e085d]
- Updated dependencies [5c060e7]
- Updated dependencies [45bcfc1]
- Updated dependencies [a79c917]
- Updated dependencies [2714583]
  - @pandacss/cli@2.0.0-beta.10
  - @pandacss/compiler@2.0.0-beta.10
  - @pandacss/config@2.0.0-beta.10
  - @pandacss/types@2.0.0-beta.10
  - @pandacss/postcss@2.0.0-beta.10

## 2.0.0-beta.9

### Minor Changes

- Bring back `cssgen:done` as an observe-only hook for final CSS from CLI, Vite, and PostCSS. Use `optimize` or PostCSS
  if you need to mutate CSS.

## 2.0.0-beta.0

### Patch Changes

- Move MCP execution out of the Panda CLI and into the `@pandacss/mcp` package.

  - Add a `panda-mcp` binary so users can run the server with `npx -y @pandacss/mcp` or `pnpm dlx @pandacss/mcp`
  - Remove the `panda mcp` and `panda init-mcp` CLI bridge commands
