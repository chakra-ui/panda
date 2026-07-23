---
'@pandacss/dev': minor
'@pandacss/mcp': minor
---

Ship MCP as its own CLI package and stop pulling it into every `@pandacss/dev` install.

- Add a `panda-mcp` binary to `@pandacss/mcp` (`npx -y @pandacss/mcp`)
- Remove `@pandacss/mcp` from `@pandacss/dev` dependencies so Hono/Express from the MCP SDK are no longer transitive for normal installs
- Keep `panda mcp` and `panda init-mcp` as compatibility shims that shell out to `npx -y @pandacss/mcp`
- Generate client configs that call `@pandacss/mcp` directly

If you already ran `panda init-mcp`, re-run it (or update your MCP config args from `["panda", "mcp"]` to `["-y", "@pandacss/mcp"]`).
