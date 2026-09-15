---
'@pandacss/cli': minor
---

Add `--outdir` to `panda cssgen`, so `--splitting` can write its files somewhere you publish instead of only the
configured `outdir`. Passing `--outfile` alongside `--splitting` now says it's ignored rather than dropping it silently.
