---
'@pandacss/dev': minor
'@pandacss/mcp': minor
'@pandacss/shared': patch
---

Move MCP out of `@pandacss/dev` so installs no longer pull the MCP SDK and Hono, which kept triggering security vulnerability reports. Use `npx -y @pandacss/mcp` instead. `panda mcp` / `panda init-mcp` now error with a migration message.
