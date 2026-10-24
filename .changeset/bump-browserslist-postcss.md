---
'@pandacss/core': patch
'@pandacss/node': patch
'@pandacss/generator': patch
'@pandacss/postcss': patch
'@pandacss/plugin-lightningcss': patch
---

Bump `browserslist` to 4.29.4 and `postcss` to 8.5.31 to pick up the fixes for CVE-2026-73088, CVE-2026-73089 and CVE-2026-73646. Apps no longer need `overrides`/`resolutions` to clear these from security scans. CSS output is unchanged.
