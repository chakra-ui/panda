---
'@pandacss/cli': patch
---

Update the CLI command set for v2.

Add `panda build`, `panda dev`, `panda check`, `panda info`, and `panda doctor`; keep `codegen`, `cssgen`, and
`buildinfo` for advanced use. Shared flags now use kebab-case, logging uses `--log-level`, and `panda --version` reports
the CLI package version.
