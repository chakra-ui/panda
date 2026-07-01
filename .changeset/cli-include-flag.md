---
'@pandacss/cli': minor
'@pandacss/compiler': minor
---

Add `--include` to scanning commands: `panda`, `build`, `dev`, `check`, `cssgen`, `debug`, `info`, and `buildinfo`.

Use it to scan a smaller file set for one run. It replaces the configured `include` globs and can be repeated or passed
comma-separated values.
