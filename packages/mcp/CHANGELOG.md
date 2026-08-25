# @pandacss/mcp

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

## 2.0.0-beta.14

### Patch Changes

- Updated dependencies [10014b4]
- Updated dependencies [a4f3944]
- Updated dependencies [9bcdcb0]
- Updated dependencies [ef7ffc7]
- Updated dependencies [6bcc885]
  - @pandacss/compiler@2.0.0-beta.14

## 2.0.0-beta.13

### Patch Changes

- Updated dependencies [b621edb]
  - @pandacss/compiler@2.0.0-beta.13

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

## 2.0.0-beta.11

### Patch Changes

- Updated dependencies [c7f949a]
  - @pandacss/compiler@2.0.0-beta.11

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
  - @pandacss/compiler@2.0.0-beta.10

## 2.0.0-beta.0

### Patch Changes

- Move MCP execution out of the Panda CLI and into the `@pandacss/mcp` package.

  - Add a `panda-mcp` binary so users can run the server with `npx -y @pandacss/mcp` or `pnpm dlx @pandacss/mcp`
  - Remove the `panda mcp` and `panda init-mcp` CLI bridge commands

## 1.10.0

### Patch Changes

- Dependency updates for reported security advisories.

  - **@pandacss/node** / **@pandacss/token-dictionary**: bump `picomatch` to 4.0.4
    ([GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p),
    [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj)).
  - **@pandacss/mcp**: bump `@modelcontextprotocol/sdk` to ^1.25.2.
  - **@pandacss/astro-plugin-studio**: bump `astro` (dev) to 5.18.1.

## 1.8.0

### Minor Changes

- **MCP Server [NEW]**: Added MCP server that exposes tools for AI agents.

  ```sh
  panda init-mcp
  ```

  Available tools: `get_tokens`, `get_semantic_tokens`, `get_recipes`, `get_patterns`, `get_conditions`,
  `get_text_styles`, `get_layer_styles`, `get_keyframes`, `get_config`, `get_usage_report`.
