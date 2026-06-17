# v2 CLI command gaps

Log of v1 CLI commands not on the v2 `@pandacss/cli`. Tracking only; this is not a commitment to port every command.

## Present on v2 CLI

Lifecycle commands:

```sh
panda init
panda dev
panda build
panda check
panda info
panda doctor
panda debug
```

Advanced commands:

```sh
panda codegen
panda cssgen
panda buildinfo
```

Bare `panda` remains a shortcut for `panda build`.

## Renamed or removed

| v1 / earlier v2 command | v2 command | Notes |
| ----------------------- | ---------- | ----- |
| `panda inspect`         | `panda info` | Project/compiler summary: config path, sources, artifacts, conditions, tokens, utilities. |
| `panda validate`        | `panda doctor` | Setup and diagnostics health check. |
| `panda --watch`         | `panda dev` | Do not document bare watch mode as a lifecycle command. `dev` is the public watch command. |

## Gaps vs v1

| v1 command          | Status on v2 | Notes |
| ------------------- | ------------ | ----- |
| `studio`            | dropped      | Astro studio package was removed. Replacement is expected to be a lighter token visualizer. |
| `analyze`           | dropped      | No Rust analyze equivalent yet. This also gates MCP usage-report functionality. |
| `ship` / `emit-pkg` | not ported   | Pre-bundled package emit. Confirm whether this is still needed under the v2 codegen model. |

## Other parity gaps

- **CLI `[files]` override** — v1 positional include overrides are not wired. The v2 build uses config `include`.
- **lightningcss minify** — lightningcss is not in the Rust workspace; `pandacss_stylesheet` does native emission.
  Minify parity is an open follow-up.
