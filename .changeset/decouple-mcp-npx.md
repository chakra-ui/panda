---
'@pandacss/dev': minor
'@pandacss/mcp': minor
---

Ship MCP as its own CLI (`npx -y @pandacss/mcp`) and remove it from `@pandacss/dev` dependencies. `panda mcp` / `panda init-mcp` still work as shims. Re-run init (or switch config args to `["-y", "@pandacss/mcp"]`) if you already set up MCP.
