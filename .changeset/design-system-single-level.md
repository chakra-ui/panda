---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/config': minor
'@pandacss/types': minor
---

Adopt a published design system with `designSystem: '@acme/ds'`.

Panda reads the library's `panda.lib.json`, merges its preset below your config, and reuses its pre-extracted styles. If
the design system needs a different Panda major version, Panda reports a clear error.
