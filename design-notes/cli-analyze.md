---
title: CLI Analyze Command
status: proposed
scope:
  - packages/cli
  - packages/compiler
  - packages/compiler-shared
  - crates/pandacss_project
---

# CLI Analyze Command

## Summary

`panda analyze` should return a project-level usage report for Panda source usage: tokens, recipes, utilities, patterns,
and keyframes. It is an observational command. It should not generate CSS, run codegen, mutate build caches, or write
anything except explicit report outputs.

Keep the command name `analyze`. It is the v1 name, it reads as an action like the rest of the CLI, and it describes the
work better than noun commands like `usage` or `report`. The output should be described as a **usage report**.

## Problem

The v1 CLI exposed `panda analyze` for token and recipe reports. The initial v2 CLI intentionally left it out while the
command surface was narrowed around build, watch, check, diagnostics, and debug workflows.

V2 now has a stronger substrate for this command:

- `compiler.inspectFileSource(path, source)` classifies Panda usage in one source file.
- `driver.scan()` already finds the project source set from config include/exclude rules.
- `driver.introspect` indexes `compiler.spec()` so the host can join source usage with configured tokens, utilities,
  recipes, patterns, and conditions.

That makes `analyze` a thin host-level aggregation command instead of another build path.

## Command Shape

Default command:

```sh
panda analyze
```

Common forms:

```sh
panda analyze "src/**/*.tsx"
panda analyze --include "src/**/*.tsx"
panda analyze --scope tokens
panda analyze --scope recipes
panda analyze --json
panda analyze --outfile panda-analysis.json
panda analyze --report panda-analysis.html
panda analyze --ui
```

The optional positional glob is a compatibility convenience for v1 users. Internally it should normalize to the same
include path as `--include`; new docs should prefer `--include` for consistency with the v2 CLI.

`--scope` should narrow the report. Public help should use plural section names:

```txt
all | tokens | recipes | utilities | patterns | keyframes
```

The parser can accept v1 singular aliases (`token`, `recipe`) and normalize them to `tokens` and `recipes`.

## Naming

Use `analyze` as the command and `usage report` as the product language.

Avoid these names:

| Name       | Problem                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| `usage`    | Noun command; can be confused with CLI help usage text.                                               |
| `report`   | Output artifact, not the action.                                                                      |
| `coverage` | Sounds pass/fail and threshold-oriented.                                                              |
| `audit`    | Implies policy or security failures.                                                                  |
| `inspect`  | Already removed from v2 in favor of `info` and `doctor`; also reads more like one-file introspection. |

The surrounding commands stay distinct:

| Command   | Question it answers                                       |
| --------- | --------------------------------------------------------- |
| `info`    | What project/config/compiler surface did Panda load?      |
| `doctor`  | Is this setup healthy enough to build?                    |
| `debug`   | What artifact bundle helps reproduce a bug?               |
| `analyze` | What Panda features does this source code use, and where? |

## Output Contract

Human output should be compact by default:

```txt
analyze: scanned 42 files
tokens: 128 uses, 76 unique, 6 unused
recipes: 14 uses, 3 recipes, 9 variant values
utilities: 381 declarations, 37 properties
```

When a scope has useful detail, print a short table after the summary. Keep full per-file details in JSON or report
output unless the user explicitly narrows the scope.

JSON output should use the normal CLI result envelope and add analyze data:

```ts
interface AnalyzeResult extends CliResult {
  sourceCount: number
  scopes: AnalyzeScope[]
  summary: AnalyzeSummary
  tokens?: TokenUsageReport
  recipes?: RecipeUsageReport
  utilities?: UtilityUsageReport
  patterns?: PatternUsageReport
  keyframes?: KeyframeUsageReport
}
```

`--outfile` writes the JSON payload to a file and keeps stdout human-readable unless `--json` is also passed. This
matches commands where the terminal remains useful while scripts receive a stable artifact.

`--report <file>` should write a static HTML report from the same JSON model. Static HTML is the first UI step because
it works in CI artifacts and pull-request workflows without starting a server.

The report should be self-contained only when the payload is compact. Embed summaries, tables, per-file counts, and
source references (`file`, `line`, `column`, `kind`, `name`), but do not embed source text, AST data, raw inspection
objects, or every extracted call payload. If the inline payload would exceed a fixed budget, the CLI should warn and
suggest a directory report:

```sh
panda analyze --report-dir panda-analysis
```

Directory mode can write `index.html` plus a JSON payload and assets. It keeps large monorepo reports useful without
turning the default single-file report into a bloated artifact.

`--ui` can come after the JSON model is stable. Treat it as a mode of `analyze`, not a new top-level command. It should
load the same analysis data and provide filtering, sorting, and source drilldown for token paths, recipe variants, raw
values, and files.

## Implementation Boundary

`analyze` should live entirely at the JS CLI host layer:

```txt
runCommand
  -> createNodeDriver
  -> driver.scan()
  -> read each source file
  -> driver.compiler.inspectFileSource(path, source)
  -> aggregate usages
  -> join with driver.introspect.spec
  -> render human/json/report
```

Do not call `driver.parseFiles()`, `driver.cssgen()`, or `codegen` from this command. Analyze reports source usage; it
does not need emitted CSS.

Primary aggregation inputs:

- `usages` for high-level counts by kind and name.
- `tokenRefs` for exact token call/reference data, including unresolved paths.
- `styleEntries` for utility/property usage, source values, shorthand expansion, and raw value hotspots.
- `componentEntries` and `jsx` for component, recipe, slot recipe, and pattern usage.
- `diagnostics` from each inspected file, plus compiler diagnostics from config setup.

Output ordering must be deterministic: sort by scope, canonical name, file path, then range. This keeps snapshots,
artifacts, and review diffs stable.

## Coverage Semantics

Unused token and recipe reporting should be included, but the wording must be precise. The report should say "unused in
scanned sources", not globally unused. Usage can live outside the configured include set, inside external design-system
packages, or behind dynamic code paths.

Compute unused coverage as:

```txt
configured surface - observed static usage
```

Token-level unused reporting is the safest first version. Recipe and recipe-variant coverage can ship when
`compiler.spec()` exposes enough structured recipe metadata to distinguish the configured recipe surface from the
observed recipe usage without reconstructing that model in the CLI.

Dynamic values should live in a separate `dynamic` or `unknown` bucket. Do not count them as used or unused. Coverage
summaries should report known static usage alongside dynamic usage sites so the numbers remain honest:

```txt
tokens: 128 known uses, 12 dynamic sites, 6 unused in scanned sources
```

## Token Suggestions

Raw-value token suggestions should use shared compiler tooling, not duplicate matching logic in the CLI and lint rules.

`analyze` should aggregate tokenization hotspots:

```txt
raw values: 24 color literals could map to existing tokens
```

Lint rules should handle per-site warnings and fixes. Both tools can consume the same suggestion engine, but their user
experience should stay different: `analyze` shows project trends, while lint reports actionable source locations during
editing and CI.

## Performance

The command should be fast enough for local iteration but does not sit on the CSS build hot path. A bounded concurrency
pool is appropriate: source file reads are IO-bound, while `inspectFileSource` crosses the native boundary and should
not be fired unbounded across large repositories.

The human renderer should aggregate as it goes and avoid keeping more source text than needed. JSON/report output can
include exact ranges and file references, but should not embed full file contents.

## Diagnostics

Diagnostics should follow the existing CLI contract:

- config and usage errors exit with the normal CLI exit codes,
- source diagnostics render through the shared diagnostic renderer,
- `--max-warnings` applies to analysis diagnostics,
- `--json` keeps stdout machine-clean,
- `--log-level debug` can include scan and inspection timings.

Unresolved token paths, unknown recipe variants, raw-value suggestions, and non-extractable dynamic values should start
as report data unless they already produce compiler diagnostics elsewhere. Turning report findings into failures belongs
in lint rules or a future explicit policy mode.

## Non-goals

Do not rebuild v1's reporter stack in TypeScript. The v2 command should use `inspectFileSource` and `compiler.spec()` as
the source of truth.

Do not make `analyze` an alias for `debug`, `info`, or `doctor`. It answers a different question and should not write
bug report dumps or setup health checks.

Do not make UI the first implementation. Stabilize the JSON data model and terminal report first, then build static HTML
and an interactive viewer on top of that model.

Do not let report output embed full project source by default. Source references are enough for the first report; source
previews can be added later behind an explicit opt-in if they prove useful.

## Unresolved Questions

- What should the inline HTML payload budget be before the CLI suggests `--report-dir`?
- What exact recipe metadata needs to be added to `compiler.spec()` before recipe-variant coverage is reliable?
- Which raw-value suggestion families should ship first: colors only, spacing/sizing too, or a configurable set?

## Related

- [CLI v2 direction](./cli.md)
- [Panda lint plugins](./lint-plugins.md)
- [Compiler diagnostics](./compiler-diagnostics.md)
- [Output and host layer](./output-and-host-layer.md)
