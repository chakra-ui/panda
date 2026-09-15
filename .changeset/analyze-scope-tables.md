---
'@pandacss/cli': minor
'@pandacss/compiler-shared': patch
---

`panda analyze` now prints a ranked table for utilities, patterns, and keyframes, with the configured names no scanned
file uses, instead of a single count. Running it without `--scope` prints every section, so the `all` value is gone.
Shorthands count as their longhand. `--unused` prints only the configured names nobody uses, one per line, for pasting
into a deprecation PR or diffing between runs.
