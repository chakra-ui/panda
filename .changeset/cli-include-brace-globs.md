---
'@pandacss/cli': patch
---

`--include` now accepts brace globs like `src/**/*.{ts,tsx}`, and repeating the flag scans every glob. Commas are no
longer treated as separators; repeat `--include` (or `--files` for `panda lib`) instead.
