---
'@pandacss/cli': minor
'@pandacss/compiler': minor
---

Add a `--include` flag to the scanning commands (`panda`, `build`, `dev`, `check`, `cssgen`, `debug`, `info`, `buildinfo`) to override the config's `include` globs for a single run. The flag is repeatable and accepts comma-separated values, and replaces (does not merge with) the configured globs — useful for scanning a subset of files in CI or one-off builds.
