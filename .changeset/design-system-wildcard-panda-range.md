---
'@pandacss/compiler': patch
'@pandacss/cli': patch
'@pandacss/config': patch
---

Fix `panda lib` and `panda buildinfo` stamping an unusable `panda: "*"` range when the design system declares no
`@pandacss/dev` peer. Consumers gate on the manifest's major, and `"*"` has none, so any such library failed to hydrate
with `manifest requires Panda *`. Both commands now fall back to the running Panda's major (`^2.0.0`) when no peer is
declared — pass `--panda` to override.
