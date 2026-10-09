---
'@pandacss/config': patch
'@pandacss/cli': patch
---

Improve config loading:

- Faster when `panda.config.ts` imports a large package, like a design system. Only the parts you import are loaded.
- Importing tokens from a UI library whose components use `window` no longer fails.
