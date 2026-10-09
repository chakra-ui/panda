---
'@pandacss/config': patch
'@pandacss/cli': patch
---

Fix slow config loading when `panda.config.ts` imports a large package, like a design system. The config is bundled
again instead of loading each package file through Node, and the CLI reuses V8's compile cache between runs.
