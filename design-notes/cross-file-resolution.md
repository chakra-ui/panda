# Cross-File Resolution

## Summary

`CrossFileResolver` lets the same-file `Resolver` follow `import { x } from './tokens'` references and fold the imported
value. Module resolution itself is delegated to `oxc_resolver` (relative paths, extension probing, tsconfig paths,
package.json `exports`). The resolver caches per-session. Unchanged imported files are parsed and folded once across the
batch; changed files replace their cached exports on the next lookup.

## Cache shape

```rust
Mutex<FxHashMap<PathBuf, CachedFileExports>>

struct CachedFileExports {
    source_hash: u64,
    exports: FxHashMap<String, ExportEntry>,
    deps: Vec<(PathBuf, Option<u64>)>,
}

enum ExportEntry {
    Literal(Literal),
    PureFn(OwnedPureFn),
}
```

`path → (source hash, exported_name → folded literal or pure-fn descriptor, nested provenance)`.

The resolver reads and hashes the current source before using a cache entry. Matching source hashes avoid another parse
and fold; changed sources replace the entry. Nested modules folded into this file (re-exports, imported aliases) are
stored as `deps` with the hash seen, `None` when the module could not be read. A dep hash miss busts the entry, so
`export { brand } from './tokens'` does not keep the old value after `tokens.ts` changes.

Pure function exports are lowered to a closed owned IR **while the AST is live**, then the AST is dropped. The cache
keeps descriptors, not `Program`s, so the resolver doesn't pin every imported file's allocator.

The cache is behind a `Mutex`, not `RefCell`, so the resolver can be shared by `ExtractorConfig` in future
parallel/bulk-file paths. The public type is `Send + Sync`.

## Watch invalidation

The resolver stays a forward lookup. Every extract reports
`dependencies: Vec<CrossFileDependency { path, source_hash }>`: the resolved module plus its provenance, each with the
hash the importer folded. `Project` inverts that into `dep → importer → hash`.

```
parse_file / refresh_file (tokens.ts, hash H)      remove_file (tokens.ts)
        │                                                  │
        ▼                                                  ▼
importers[tokens.ts] where hash ≠ H                 importers[tokens.ts] where hash ≠ None
        │                                                  │
        └──────────────► affected_files ◄──────────────────┘
                              │
                              ▼  affectedFiles()
              host: refreshFile(each) → call again until empty
```

The hash comparison is what keeps this cheap. A cold build parses `tokens.ts` after its importers already folded the
current bytes, so nothing is affected and nothing is parsed twice. Marking a file also clears its `cacheable` flag, so
its unchanged source gets past the same-hash short-circuit on the next parse.

The project never re-parses importers itself. Pattern and utility transforms are JS callbacks owned by the host, so a
cascade inside Rust would produce untransformed atoms. The host reads `affectedFiles()` after every change and re-parses
through its normal `refreshFile` path (`BaseDriver.refreshAffectedFiles`). That path is additive, like any other watch
refresh, so dev CSS keeps the old atom alongside the new one until the next full build.

Host paths may not match the resolver's realpath form (`/var` vs `/private/var`). `dependency_key` normalizes through
the resolver's filesystem. A deleted file canonicalizes its parent so unlink events still match.

Failed resolutions are retained as `(from_file, specifier)` requests. When a new file enters the project, `Project`
probes only those requests with a fresh resolver. If one now resolves, the long-lived resolver cache is cleared and its
importer is reported through `affectedFiles()`. Nested requests are also stored on cached exports, so creating a module
behind a re-export invalidates the cached miss.

## What folds

Top-level named exports where the exported value resolves to a static literal **or** a simple pure callable:

- `export const x = <foldable>`
- `export let x = <foldable>` / `export var x = <foldable>` when the binding is not mutated
- `export const f = (name) => \`.${name}:hover &\``/`export function f() { return '…' }` when the body lowers
- exported aliases, e.g. `const button = base; export { button }`
- re-exports, e.g. `export { button } from './base'` (literals and pure fns)
- file-local alias chains, e.g. `const button = base; export const primary = button`
- imported aliases inside the exported file
- `css.raw(...)`, `cva.raw(...)`, and pattern raw calls when their imports match the configured Panda matchers

The loaded file gets its own `Resolver`, so export collection uses the same identifier/member/spread/destructuring
semantics as same-file extraction. Call sites apply `OwnedPureFn` with folded arguments via `resolve_pure_call`.

## What doesn't fold (yet)

- `export default …` — same surface as named exports but currently skipped to keep the v1 contract narrow.
- Namespace/default imports in the importing file — they don't map cleanly to one named export.
- Impure or unsupported callables, bare function values used without a call, classes, and anything the literal evaluator
  intentionally rejects.

## Resolver hand-off

When the same-file `Resolver` encounters an `Import` flag during `resolve_symbol`, it walks the symbol's declaration up
to the enclosing `ImportDeclaration`:

```rust
// Walk: symbol → ImportSpecifier → ImportDeclaration
// Recover: (module_specifier, imported_name)
// Hand off to CrossFileResolver
```

Only named import specifiers reach the cross-file path. Default and namespace specifiers return `None` immediately —
they don't map cleanly to a single named export and our common case is `import { token } from '…'` style.

Inside the loaded file, `collect_exports` builds a per-file `Resolver`. This costs one semantic pass per imported source
revision, but unchanged exports are served from the cache and the AST is dropped. That tradeoff buys parity for local
aliases, computed keys, destructuring, imported values in the exported file, and Panda `.raw()` helpers without keeping
AST memory alive.

## Cycle guard

```rust
in_flight: Mutex<FxHashSet<(PathBuf, String)>>
```

`a.ts` re-exports from `b.ts` which re-exports from `a.ts` would otherwise overflow the stack. The guard is best-effort:
when the same `(path, export_name)` is already being resolved, return `None`. The guard is removed after the file's
exports are collected.

## Lifecycle and sharing

`CrossFileResolver` is **not** `Clone`. Wrap in `Arc` for shared ownership across sessions. The expected pattern: one
resolver per build / dev-server session, threaded through `ExtractorConfig` for every `extract()` call in the batch.

```rust
let cross_file = CrossFileResolver::new();
let config = ExtractorConfig::new(matchers).with_cross_file(cross_file);
for file in files {
    let result = extract(file.source, file.path, &config);
}
```

The `Project` façade does this automatically — `with_cross_file` on the project plumbs the resolver into the shared
config.

## I/O failures

A read failure removes the previous cache entry and returns no export, so a deleted or unreadable file never serves
stale data. Parse failures use Oxc's partial AST and cache any exports that still fold, matching the JS extractor's
best-effort recovery behavior. Recreating a previously resolved file refreshes its exports on the next lookup.

## StyleTree hand-off

Imported style bindings rehydrate through `literal_to_style_tree`. `Literal::Conditional` becomes `StyleTree::Branches`
(no foreign spans). Encode still expands every arm; transform cannot emit a runtime ternary for the foreign test — it
uses the static Conditional path (both branch classes). Same-file conditionals keep `Ternary` / `And` with local spans.

## Related

- [literal-evaluator](./literal-evaluator.md)
- [style-tree](./style-tree.md)
- [extraction-pipeline](./extraction-pipeline.md)
