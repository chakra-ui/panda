---
'@pandacss/mcp': patch
---

Fix `panda init-mcp` generating an MCP server config that AI clients couldn't run, or that couldn't find your Panda
config.

The command was `npx panda mcp`, which resolves an unrelated `panda` package on npm and fails with "could not determine
executable to run". It now runs `npx -y --package @pandacss/dev panda mcp` and sets the server's `cwd` to your project,
so the correct binary runs and your config is always found.
