---
'@pandacss/astro-plugin-studio': patch
---

**Studio**: Fix React SSR errors when running Panda Studio.

- `ReferenceError: module is not defined` - React's CJS entry point was loaded in an ESM context
- `TypeError: dispatcher.getOwner is not a function` - React development/production builds were mixed during SSR
