---
'@pandacss/compiler': patch
---

Fixed trace files written with the `PANDA_TRACE` environment variable being cut short. The trace now finishes when the
process exits, including in the Vite and PostCSS plugins.
