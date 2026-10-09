---
'@pandacss/config': patch
'@pandacss/cli': patch
---

Fix slow config loading when `panda.config.ts` imports a large package, like a design system. The config is bundled
again and unused parts of imported packages are left out, so a config can also import tokens from a UI library whose
components touch `window`.
