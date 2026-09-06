---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Ignore watcher add and change events for unknown paths outside the configured source globs. Explicitly registered and
design-system sources remain refreshable.
