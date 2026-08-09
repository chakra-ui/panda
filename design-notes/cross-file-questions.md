# Cross-file questions

## Summary

Panda answers two different kinds of cross-file question, and they need different machinery. Getting this wrong leads to
rebuilding a module graph Panda does not own.

**Forward questions** — "what value does this import give me?" — are answered lazily by `CrossFileResolver`: resolve the
specifier, parse the module, fold what it exports, cache the descriptors, drop the AST. One edge, on demand. Works in
every context: the CLI, the PostCSS plugin, and bundler plugins.

**Reverse or whole-program questions** — "who consumes this recipe?", "which variants are reachable through wrapper
components?", "which files must re-run when this definition changes?" — cannot be answered from one file. Ask the host
bundler; do not build a second graph.

## Why not build our own graph

TypeScript builds a whole-program graph because types are global — a type can be declared anywhere and merged across
files. ts-morph inherits that, which is how v1 answered cross-file questions. v2 dropped it deliberately (no TypeScript
program in the hot path) because Panda's question is narrower: a value along one specific edge.

Building a Panda-owned graph in the transform path costs three things:

- the bundler already owns file discovery, ordering and invalidation, and `transform_source` is called per file
- a graph walked from the project root follows imports the bundler tree-shakes away, so it ends up larger than the
  actual build, and every file in it is a second parse
- two invalidation systems that must agree, where disagreement is a correctness bug rather than slowness

## What the host already has

Rolldown builds exactly this graph in Rust on Oxc — `ModuleTable`, `ImportRecord` for forward edges, `ImporterRecord`
for reverse ones, indexed by arena `ModuleIdx`. Rollup, Vite and Rolldown all expose it to plugins:

- `this.getModuleInfo(id)` → `importedIds`, `importers`, `dynamicallyImportedIds`, `dynamicImporters`
- `this.getModuleIds()` → every module in the graph

One constraint: `importers` starts empty and fills as the build discovers modules. It is only complete after `buildEnd`,
so reverse queries belong there, not in `transform`.

`packages/vite` uses none of this today — only `moduleGraph.getModuleById` and `invalidateModule` for HMR.

## The CLI path

`panda cssgen` has no host graph, but Panda globs the file set itself there, so it can build a cheap edge map when a
feature needs one. Any feature built on host-graph queries has to degrade for this path.

## Worked example

A component that imports only a recipe used to be skipped, because Panda skips files that import nothing from Panda — so
`button.raw()` there kept reading a class string. The fix was not a graph. The skip test also asks whether the file
calls `.raw(...)` on a binding it imported: syntactic, over an AST already parsed, no resolution. Reach for the graph
when a question is genuinely reverse, not when a local check will do.

## Related

- [cross-file-resolution](./cross-file-resolution.md)
- [extraction-pipeline](./extraction-pipeline.md)
- [performance-budget](./performance-budget.md)
