---
'@pandacss/dev': patch
'@pandacss/mcp': patch
---

Move MCP execution to `@pandacss/mcp`.

Use the new `panda-mcp` binary through `npx -y @pandacss/mcp` or `pnpm dlx @pandacss/mcp`. The old `panda mcp` and
`panda init-mcp` bridge commands have been removed.
