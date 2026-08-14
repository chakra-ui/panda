---
'@pandacss/node': patch
---

Replace Prettier with Formatly for config file formatting. This allows generated config files to be formatted according to the project's existing formatter choice (Biome, dprint, deno fmt, or Prettier) instead of always using Prettier.
