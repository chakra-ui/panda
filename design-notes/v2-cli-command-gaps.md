# v2 CLI command gaps

Log of v1 CLI commands not (yet) on the v2 `@pandacss/cli`, captured during the post-#3578 v1 purge. Tracking only — not a commitment to port.

## Present on v2 cli

`init`, `codegen`, `cssgen`, `buildinfo`, `inspect`, `validate` (see `packages/cli/src/commands/`).

## Gaps vs v1

| v1 command | Status on v2 | Notes |
| ---------- | ------------ | ----- |
| `studio` | dropped | Astro studio package removed in #3578. Replacement tracked in Linear (open, shadcn-style token visualizer). |
| `analyze` | dropped | No rust analyze equivalent yet. Also gates mcp `get_usage_report`, which #3578 dropped until this lands. |
| `debug` | not ported | Diagnostic dump (config/tokens/parser output). Re-scope against the rust driver if there's demand. |
| `ship` / `emit-pkg` | not ported | Pre-bundled package emit. Confirm whether still needed under the v2 codegen model. |

## Other parity gaps (non-command)

- **lightningcss minify** — lightningcss is not in the rust workspace; the `pandacss_stylesheet` crate does native emission. Minify parity is an open follow-up (per #3578).
