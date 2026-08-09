---
'@pandacss/compiler': patch
---

Fix `@pandacss/compiler/tooling` failing to load the native binding, which broke the ESLint/oxlint plugin with
`Native project does not support pattern.transform callbacks` on any config using preset patterns. The binding is now
resolved from the package root instead of relative to the emitted module, and a binding that genuinely fails to load now
says so.
