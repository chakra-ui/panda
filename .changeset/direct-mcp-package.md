---
'@pandacss/dev': patch
'@pandacss/mcp': patch
---

Move MCP execution out of the Panda CLI and into the `@pandacss/mcp` package.

- Add a `panda-mcp` binary so users can run the server with `npx -y @pandacss/mcp` or `pnpm dlx @pandacss/mcp`
- Remove the `panda mcp` and `panda init-mcp` CLI bridge commands
