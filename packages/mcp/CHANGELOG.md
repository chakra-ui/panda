# @pandacss/mcp

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
