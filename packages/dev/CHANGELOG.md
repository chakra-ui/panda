# @pandacss/dev

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
