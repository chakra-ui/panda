---
'@pandacss/config': patch
'@pandacss/cli': patch
---

Faster config loading when `panda.config.ts` imports a large package, like a design system: only the parts you import
are loaded. Importing tokens from a UI library whose components use `window` no longer fails.
