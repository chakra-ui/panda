---
'@pandacss/config': patch
---

Fix config loading when a config imports a CommonJS preset that calls `require()`, such as `pandacss-preset-typography`.

Panda now evaluates bundled configs from a temporary `file://` module when possible, so CommonJS interop resolves from a
real path.
