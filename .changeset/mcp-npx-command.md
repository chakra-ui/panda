---
'@pandacss/mcp': patch
---

Fix `panda init-mcp` generating a server config that AI clients can't run. The config used `npx panda mcp`, but `panda` is an unrelated package on npm with no executable, so clients failed with "could not determine executable to run" (the same happens with `bunx panda mcp`).

The generated config now runs `npx -y --package @pandacss/dev panda mcp`, which resolves the correct binary and falls back to the local install when one is present.
