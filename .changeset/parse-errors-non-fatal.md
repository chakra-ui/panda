---
'@pandacss/compiler': patch
---

A file Panda can't fully parse no longer aborts the whole build. Parse errors are now warnings that explain some styles may be missing. The bundler (astro/vite/tsc) still reports genuine syntax errors, and `--max-warnings 0` restores strict failure for callers that want it.
