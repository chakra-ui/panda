---
'@pandacss/config': patch
---

Previously, when your Panda config failed to load, the real error could be hidden behind a confusing
`Please pass in filename to use require` message (most often when running under Bun). Panda now reports the actual
config error instead.
