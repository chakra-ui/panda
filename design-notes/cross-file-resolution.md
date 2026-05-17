# Cross-File Resolution

## Summary

`CrossFileResolver` lets the same-file `Resolver` follow `import { x } from './tokens'` references and fold the imported
value. Module resolution itself is delegated to `oxc_resolver` (relative paths, extension probing, tsconfig paths,
package.json `exports`). The resolver caches per-session so each imported file is parsed and folded exactly once across
the batch.

## Cache shape

```rust
RefCell<HashMap<PathBuf, FxHashMap<String, Literal>>>
```

`path → (exported_name → folded literal)`.

Each file is parsed once. The AST is dropped after exports are extracted — we keep the exports map but not the
`Program`, so the resolver doesn't pin every imported file's allocator. For a medium-sized app with hundreds of imports,
this is the difference between a few MB and tens of MB of live AST memory at steady state.

## What folds

Top-level `export const X = <foldable>` only. The `<foldable>` expression goes through the standard
`expression_to_literal` path with **no** resolver — see "Resolver hand-off" below for why.

## What doesn't fold (yet)

- `export { x } from './other'` re-exports — the resolver doesn't recurse through them. Add when the common case proves
  out.
- `export default …` — same surface as named exports but currently skipped to keep the v1 contract narrow.
- Destructuring on the LHS (`export const { a, b } = obj`) — those patterns would need a re-export of the original RHS
  too, which the JS extractor doesn't fold cleanly either.
- Anything beyond `export const` (functions, classes, enums).
- Chained file-local references in the imported file — `export const brand = primary` doesn't follow the inner
  identifier.

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

Inside the loaded file, `collect_exports` runs **without** a per-file `Resolver`. Building one would require a full
semantic pass on every imported file, and the common shape (`export const X = <object / string / array>`) folds without
scope context. Chained file-local references are a follow-up — punt with a `// PORT NOTE:` rather than do the work
eagerly.

## Cycle guard

```rust
in_flight: RefCell<HashSet<PathBuf>>
```

`a.ts` re-exports from `b.ts` which re-exports from `a.ts` would otherwise overflow the stack. The guard is best-effort:
when we're already mid-load for a path, return `None`. The pending entry is inserted into the cache before recursion and
removed after, so subsequent hits get the partial-or-complete result depending on what the recursion produced.

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

`extract_exports` swallows read errors and parse failures, returning an empty exports map. The dictionary still caches
the empty map so subsequent references to the same module short-circuit. Strict correctness consumers can detect the
empty case at the call site — the resolver itself stays best-effort, matching the JS extractor's recovery behavior.

## Related

- [literal-evaluator](./literal-evaluator.md)
- [extraction-pipeline](./extraction-pipeline.md)
