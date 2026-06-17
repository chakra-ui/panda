# @pandacss/mcp

## 2.0.0-beta.1

### Patch Changes

- @pandacss/compiler@2.0.0-beta.1

## 2.0.0-beta.0

### Patch Changes

- a996903: Move MCP execution out of the Panda CLI and into the `@pandacss/mcp` package.

  - Add a `panda-mcp` binary so users can run the server with `npx -y @pandacss/mcp` or `pnpm dlx @pandacss/mcp`
  - Remove the `panda mcp` and `panda init-mcp` CLI bridge commands

- Updated dependencies [b567ae6]
- Updated dependencies [8e66595]
- Updated dependencies [cc30235]
- Updated dependencies [939a3d9]
- Updated dependencies [742d649]
  - @pandacss/compiler@2.0.0-beta.0

## 1.10.0

### Patch Changes

- bc2b8d7: Dependency updates for reported security advisories.

  - **@pandacss/node** / **@pandacss/token-dictionary**: bump `picomatch` to 4.0.4
    ([GHSA-3v7f-55p6-f55p](https://github.com/advisories/GHSA-3v7f-55p6-f55p),
    [GHSA-c2c7-rcm5-vvqj](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj)).
  - **@pandacss/mcp**: bump `@modelcontextprotocol/sdk` to ^1.25.2.
  - **@pandacss/astro-plugin-studio**: bump `astro` (dev) to 5.18.1.

- Updated dependencies [c31f3a2]
- Updated dependencies [bbaa8b3]
- Updated dependencies [22b444d]
- Updated dependencies [bc2b8d7]
- Updated dependencies [8d3b6f8]
- Updated dependencies [44457bb]
  - @pandacss/types@1.10.0
  - @pandacss/logger@1.10.0
  - @pandacss/node@1.10.0
  - @pandacss/token-dictionary@1.10.0

## 1.9.1

### Patch Changes

- Updated dependencies [d02fcf6]
  - @pandacss/token-dictionary@1.9.1
  - @pandacss/node@1.9.1
  - @pandacss/logger@1.9.1
  - @pandacss/types@1.9.1

## 1.9.0

### Patch Changes

- @pandacss/node@1.9.0
- @pandacss/logger@1.9.0
- @pandacss/token-dictionary@1.9.0
- @pandacss/types@1.9.0

## 1.8.2

### Patch Changes

- Updated dependencies [331d1a5]
  - @pandacss/types@1.8.2
  - @pandacss/logger@1.8.2
  - @pandacss/node@1.8.2
  - @pandacss/token-dictionary@1.8.2

## 1.8.1

### Patch Changes

- Updated dependencies [3c86c29]
  - @pandacss/types@1.8.1
  - @pandacss/logger@1.8.1
  - @pandacss/node@1.8.1
  - @pandacss/token-dictionary@1.8.1

## 1.8.0

### Minor Changes

- d7e46e0: **MCP Server [NEW]**: Added MCP server that exposes tools for AI agents.

  ```sh
  panda init-mcp
  ```

  Available tools: `get_tokens`, `get_semantic_tokens`, `get_recipes`, `get_patterns`, `get_conditions`,
  `get_text_styles`, `get_layer_styles`, `get_keyframes`, `get_config`, `get_usage_report`.

### Patch Changes

- @pandacss/logger@1.8.0
- @pandacss/node@1.8.0
- @pandacss/token-dictionary@1.8.0
- @pandacss/types@1.8.0
