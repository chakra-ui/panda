---
'@pandacss/compiler': patch
---

A file Panda can't parse no longer aborts the whole build. Parse errors are now warnings: Panda skips the unparseable file, reports the diagnostic, and continues. The bundler (astro/vite/tsc) still reports genuine syntax errors, and `--max-warnings 0` restores strict failure for callers that want it.
