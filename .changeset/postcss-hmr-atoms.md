---
'@pandacss/compiler-shared': patch
'@pandacss/compiler': patch
'@pandacss/postcss': patch
---

Fix PostCSS HMR style updates.

Component edits now keep previous atoms available during refresh, and design-system source fallback files refresh through the driver instead of waiting for a restart.
