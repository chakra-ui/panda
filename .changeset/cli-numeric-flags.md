---
'@pandacss/cli': patch
---

Fail on non-numeric values for `--max-warnings`, `--watch-debounce`, `--limit`, and `--ui-port`. A typo like
`--max-warnings=abc` used to be ignored, which silently turned the warning gate off in CI.
