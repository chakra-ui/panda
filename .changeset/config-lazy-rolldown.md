---
'@pandacss/config': patch
---

Config bundling is now lazy. `rolldown` is only `import()`-ed when a config actually needs bundling, instead of loading eagerly on every `@pandacss/config` import — cuts a meaningful chunk of per-command startup overhead.
