# v2 CLI command gaps

Log of v1 CLI commands not yet on the v2 `@pandacss/cli`, captured during the post-v1 purge. Tracking only; this is not
a commitment to port every command.

## Present on v2 CLI

`init`, `codegen`, `cssgen`, `buildinfo`, `inspect`, `validate` (see `packages/cli/src/commands/`).

## Gaps vs v1

| v1 command          | Status on v2     | Notes                                                                                                                      |
| ------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| bare `panda`        | done             | Default command (no subcommand) = full build (codegen + cssgen). See [beta-cli-commands](./beta-cli-commands.md).          |
| `debug`             | planned for beta | Diagnostic dump (config + per-file extraction + css) via the Rust driver. See [beta-cli-commands](./beta-cli-commands.md). |
| `studio`            | dropped          | Astro studio package was removed. Replacement is expected to be a shadcn-style token visualizer.                           |
| `analyze`           | dropped          | No Rust analyze equivalent yet. This also gates MCP usage-report functionality.                                            |
| `ship` / `emit-pkg` | not ported       | Pre-bundled package emit. Confirm whether this is still needed under the v2 codegen model.                                 |

## Other parity gaps

- **lightningcss minify** — lightningcss is not in the Rust workspace; `pandacss_stylesheet` does native emission.
  Minify parity is an open follow-up.
