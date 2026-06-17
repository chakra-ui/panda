---
'@pandacss/cli': patch
---

Improve the CLI surface with standard devtool commands and version output.

- Add `panda build`, `panda dev`, `panda check`, `panda info`, and `panda doctor`.
- Keep advanced `codegen`, `cssgen`, and `buildinfo` commands working.
- Replace `inspect` with `info` and `validate` with `doctor`.
- Replace `--silent`, `--quiet`, and `--verbose` with `--log-level`.
- Use kebab-case shared flags like `--max-warnings`, `--watch-debounce`, `--trace-output`, and `--trace-file`.
- Validate CLI flags with typed schemas and report invalid values clearly.
- Fix `panda --version` and `panda -v` to print the CLI package version.
