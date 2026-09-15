---
title: CLI Analyze Command
status: implemented
scope:
  - packages/cli
  - packages/compiler
  - packages/compiler-shared
  - crates/pandacss_project
---

# CLI Analyze Command

## Summary

`panda analyze` returns a project-level usage report for Panda source usage: tokens, recipes, utilities, patterns, and
keyframes. It is an observational command. It does not generate CSS, run codegen, mutate build caches, or write anything
except explicit report outputs.

Keep the command name `analyze`. It is the v1 name, it reads as an action like the rest of the CLI, and it describes the
work better than noun commands like `usage` or `report`. The output should be described as a **usage report**.

The implementation ships terminal output, JSON output, and `--outfile`. It does not ship a report viewer: the static
HTML report and the live `--ui` server were removed in the beta line because a bundled Preact app, a Vite build, and a
watch-driven server were too much surface for the CLI package. The JSON model is the contract for any viewer; the wasm
build exports `createUsageReport`, so the playground or a studio page can render the same data in the browser.

## Problem

The v1 CLI exposed `panda analyze` for token and recipe reports. The initial v2 CLI intentionally left it out while the
command surface was narrowed around build, watch, check, diagnostics, and debug workflows.

V2 now has a stronger substrate for this command:

- `compiler.inspectFile({ path, source })` classifies Panda usage in one source file.
- `compiler.inspectFiles(files)` batches the same inspection without adding report-specific aggregation.
- `createUsageReport(inspection, { scope, spec, suggestTokens })` joins source inspection with the configured
  design-system surface.
- `driver.scan()` already finds the project source set from config include/exclude rules.
- `compiler.spec()` exposes configured tokens, utilities, recipes, patterns, keyframes, and conditions for coverage
  reporting.
- `compiler.suggestTokens(prop, value)` provides shared raw-value token suggestions without duplicating matching logic
  in the CLI.

That makes `analyze` a thin host-level aggregation command instead of another build path.

## Command Shape

Default command:

```sh
panda analyze
```

Common forms:

```sh
panda analyze --include "src/**/*.tsx"
panda analyze --scope tokens
panda analyze --scope recipes
panda analyze --limit 25
panda analyze --json
panda analyze --outfile panda-analysis.json
```

Use `--include` for source narrowing. It is explicit, consistent with the v2 CLI, and avoids adding a positional form
that competes with subcommands or future arguments.

`--scope` should narrow the report. Public help should use plural section names:

```txt
tokens | recipes | utilities | patterns | keyframes
```

The parser can accept v1 singular aliases (`token`, `recipe`) and normalize them to `tokens` and `recipes`.

`--limit` caps terminal rows per detailed section. It does not affect JSON or report files.

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

Human output should be a bounded ranked report. It should show enough detail to answer the common question without
dumping every source site into the terminal:

```txt
analyze: scanned 42 files

Tokens
Category   Used              Top tokens                         Raw values   Files
colors     23/124 (18.55%)   red.500 (8), gray.100 (5)          6            14
spacing    8/64 (12.50%)     4 (4), 2 (2), 6 (2)                3            9
fonts      2/8 (25.00%)      body (1), heading (1)              0            3

Recipes
Recipe    Variants          Top variants                        Files   Used as
button    5/12 (41.67%)     size.sm (4), variant.solid (3)      8       jsx 75%, fn 25%
badge     2/6 (33.33%)      size.md (2), tone.info (1)          3       jsx 100%, fn 0%
```

Human output with no `--scope` prints the summary and every section; a single scope prints that section alone. There is
no `all` value: omitting the flag already means all, and a synonym would be repetition. Utilities, patterns, and
keyframes share one shape, ranked by uses with the configured names nobody uses underneath, since "what can I prune" is
the question behind all three:

```txt
Keyframes   1/2 used (50.00%)
Keyframe   Uses   Files
spin       1      1
Unused in scanned sources (1): pulse
```

Utilities count by canonical name, so a shorthand and its longhand are one row and one configured entry.

`--unused` is the removal-tool view, in the shape knip and depcheck print: only the configured names nobody uses, one
per line, no cap, grouped by section. With `--scope` the headings go too, so the output is just names and pipes into
`xargs` or a diff. The tables stay the exploratory view; `--unused` is the list you act on. It never changes the exit
code: unused is data, and policy belongs to lint.

The summary that opens the unscoped output looks like:

```txt
Summary
tokens      31 uses, 17 unique, 9 unused in scanned sources
recipes     14 uses, 2 recipes, 7 variant values
utilities   381 declarations, 37 properties
patterns    22 uses, 4 patterns
keyframes   3 uses, 2 keyframes
```

Use precise, neutral labels:

- `Used` should include both count and percentage, for example `23/124 (18.55%)`.
- `Top tokens` and `Top variants` should include occurrence counts inline.
- `Raw values` should replace v1's `Hardcoded` label. Analyze is observational; lint rules can decide whether a raw
  value is a violation.
- `Files` should count distinct scanned files containing that category, recipe, or item.

Cap detailed terminal rows with `--limit` and keep full per-file details in JSON or report output. Human output may
evolve; JSON is the stable scripting contract.

JSON output should use the normal CLI result envelope and add analyze data:

```ts
interface AnalyzeResult extends CliResult {
  sourceCount: number
  scope: AnalyzeScope | 'all'
  summary: AnalyzeSummary
  facts: {
    files: FileFact[]
    tokens: TokenFact[]
    tokenUsages: TokenUsageFact[]
    rawValues: RawValueFact[]
    rawValueUsages: RawValueUsageFact[]
    rawValueSuggestions: RawValueSuggestionFact[]
    recipes: RecipeFact[]
    recipeUsages: RecipeUsageFact[]
    recipeVariantUsages: RecipeVariantUsageFact[]
  }
  views?: {
    tokens: TokenUsageReport
    recipes: RecipeUsageReport
  }
  usages: Array<{ kind: 'token' | 'recipe' | 'utility' | 'pattern' | 'keyframe'; name; file; line; column }>
}
```

`usages` is the flat, denormalized list of every site the report counted, ordered by file and position. It exists for
scripts: `jq '.usages[] | select(.name == "colors.brand.300")'` answers the removal question without joining `facts`.

Treat `facts` as the source of truth. It should be table-shaped so terminal output and any external viewer can project
from the same data. `views` are derived conveniences for the terminal renderer, and `usages` is the grep-friendly list
for scripts.

A `recipe-variant` style entry names the CSS key it sits on, not a recipe. Attribute it to the configured recipe call
that owns it, and never count it as a recipe use: the call or JSX element is already counted. Local `cva` and `sva`
bodies produce these entries too and must not surface as recipes.

`summary` includes `used`, `unique`, and configured `total` when the design-system surface exposes a denominator, so a
viewer can render usage relative to the configured surface.

`--outfile` writes the JSON payload to a file and keeps stdout human-readable unless `--json` is also passed. This
matches commands where the terminal remains useful while scripts receive a stable artifact.

Report artifacts live outside the CLI. Terminal output is compact and ranked, JSON is explicit and stable, and anything
richer reads the JSON.

## Implementation Boundary

`analyze` lives entirely at the JS CLI host layer:

```txt
runCommand
  -> createNodeDriver
  -> driver.scan()
  -> read each source file
  -> driver.compiler.inspectFiles(files)
  -> createUsageReport(inspection, {
       scope,
       spec: driver.compiler.spec(),
       suggestTokens: driver.compiler.suggestTokens,
     })
  -> render human/json
```

Do not call `driver.parseFiles()`, `driver.cssgen()`, or `codegen` from this command. Analyze reports source usage; it
does not need emitted CSS.

Primary aggregation inputs:

- `usages` for high-level counts by kind and name.
- `tokenRefs` for exact token call/reference data, including unresolved paths.
- `styleEntries` for utility/property usage, source values, shorthand expansion, and raw value hotspots.
- `componentEntries` and `jsx` for component, recipe, slot recipe, and pattern usage.
- `diagnostics` from each inspected file, plus compiler diagnostics from config setup.
- `compiler.spec()` for configured token categories, token values, recipes, slot recipes, utilities, patterns, and
  keyframes.
- `compiler.suggestTokens(prop, value)` for raw-value token suggestions after raw pairs have been deduplicated.

`inspectFile` should stay source-local. It can enrich entries with cheap facts already known during classification:

- canonical utility/property name,
- token category,
- known token path when a value resolves to a configured token,
- raw source value,
- recipe name,
- static recipe variant name/value,
- source syntax such as JSX prop, CSS call, recipe call, or pattern call.

Do not compute project-wide coverage or token suggestions inside `inspectFile`. Coverage needs the full scanned batch
plus the configured design-system surface. Token suggestions should be deduplicated first so repeated raw values do not
cause repeated native calls.

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

Configured totals should be part of the data model, not a UI-only calculation. `compiler.spec()` exposes token
categories, recipe variants, utilities, patterns, and keyframe names, so `createUsageReport` can compute:

- token category coverage from `spec.tokens.categories`,
- token path usage from known observed token paths,
- recipe variant-value coverage from `spec.recipes` and `spec.slotRecipes`,
- configured totals for utilities, patterns, and keyframes,
- recipe usage mode from JSX/component entries vs recipe function entries.

Dynamic values should live in a separate `dynamic` or `unknown` bucket. Do not count them as used or unused. Coverage
summaries should report known static usage alongside dynamic usage sites so the numbers remain honest:

```txt
tokens: 128 known uses, 12 dynamic sites, 6 unused in scanned sources
```

## Token Suggestions

Raw-value token suggestions should use shared compiler tooling, not duplicate matching logic in the CLI and lint rules.

`analyze` should aggregate tokenization hotspots after deduping raw value pairs:

```txt
raw values: 24 color literals could map to existing tokens
```

Lint rules should handle per-site warnings and fixes. Both tools can consume the same suggestion engine, but their user
experience should stay different: `analyze` shows project trends, while lint reports actionable source locations during
editing and CI.

## Performance

The command should be fast enough for local iteration but does not sit on the CSS build hot path. A bounded concurrency
pool is appropriate: source file reads are IO-bound, while source inspection crosses the native boundary and should not
be fired unbounded across large repositories.

Keep the report pass linear in the inspected entries plus configured surface size:

```txt
O(files + inspected entries + configured tokens + configured recipe variants)
```

Avoid repeated native calls in aggregation. For token suggestions, collect unique `{ prop, value }` pairs first, then
call `suggestTokens` once per unique pair.

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

Do not rebuild v1's reporter stack in TypeScript. The v2 command should use compiler source inspection and
`compiler.spec()` as the source of truth.

Do not make `analyze` an alias for `debug`, `info`, or `doctor`. It answers a different question and should not write
bug report dumps or setup health checks.

Do not put a report viewer back in the CLI. A viewer should project the same JSON report used by the terminal and
`--outfile`, and it belongs in the playground or studio, not in `@pandacss/cli`.

Do not let report output embed full project source by default. Source references are enough for the first report; source
previews can be added later behind an explicit opt-in if they prove useful.

## Unresolved Questions

- What should the default `--limit` be for terminal rows per section?
- Which raw-value suggestion families should be shown by default: colors only, spacing/sizing too, or all categories
  where `suggestTokens` returns useful candidates?
- Where should the browser viewer live: the playground, a studio page, or a separate package?

## Related

- [CLI v2 direction](./cli.md)
- [Panda lint plugins](./lint-plugins.md)
- [Compiler diagnostics](./compiler-diagnostics.md)
- [Output and host layer](./output-and-host-layer.md)
