---
'@pandacss/compiler-shared': minor
'@pandacss/compiler': minor
'@pandacss/config': minor
'@pandacss/types': minor
---

Adopt a published design system with one config field: `designSystem: '@acme/ds'`.

Panda reads the library's `panda.lib.json`, merges its preset under your config (your overrides win), points its components at the design system's own styled-system, and reuses its pre-extracted styles instead of re-extracting them. If your Panda is a different major than the design system needs (say a v2 design system on Panda v1), you get a clear error instead of broken output.
