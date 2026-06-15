---
'@pandacss/cli': minor
---

Add the default `panda` command (no subcommand) that runs the full build — codegen then cssgen — in a single driver
pass, restoring the v1 ergonomic where the common case is one word.

- Shares the build across both passes (one config load, merged diagnostics, one summary line).
- Supports `--outdir`, `--outfile`, `--splitting`, `--clean`, `--check`, `--watch`, and the common flags. `--outdir`
  relocates both the generated system and the CSS file under one root.
- Named subcommands (`codegen`, `cssgen`, `init`, …) must come first (`panda codegen …`); a leading flag runs the
  default build (`panda --watch`).
