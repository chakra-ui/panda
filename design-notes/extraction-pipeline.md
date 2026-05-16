# Extraction Pipeline

## Summary

`extract(source, path, config)` is the single-pass entry into the extractor. One Oxc parse produces one AST that feeds
every visitor; imports, call sites, JSX elements, and identifier resolution all share that AST and one semantic build.
The staged entrypoints (`extract_calls`, `extract_jsx`) exist for testing and skip the semantic build cost.

## Flow

```
source ─→ Oxc Parser ─→ Program ─┬─→ collect_imports  ─→ ImportRecord[]
                                 │
                                 ├─→ match_import_records (Matchers)
                                 │
                                 ├─→ (fast path: matched.is_empty() → bail)
                                 │
                                 ├─→ Resolver::build (Semantic + aliases)
                                 │
                                 ├─→ collect_calls  ─→ ExtractedCall[]
                                 │
                                 └─→ collect_jsx    ─→ ExtractedJsx[]
```

Each visitor walks the program _once_. They share a `VisitorContext` that owns the alias lookup and an optional
`Resolver` for same-file scope. Two distinct return shapes:

- `ExtractUsage` — lean (`calls`, `jsx`, `diagnostics`). Production hot path; strips `imports` and `matched` so callers
  don't pay NAPI serialization cost.
- `ExtractDebugResult` — kitchen sink (`imports`, `matched`, `calls`, `jsx`, `diagnostics`). For tooling and
  parity-compare flows.

## Fast path: no Panda imports

When `matched.is_empty()`, skip the resolver build and both visitor walks entirely. Parse diagnostics still flow through
because they're independent of Panda usage.

The JSX visitor needs `styled` / `Box` / pattern imports to be matched first, and the call visitor needs a Panda import
to match an alias — without any matches, both visitors are guaranteed to produce zero output. Skipping is a measurable
win on files like `node_modules/**/*.js` that flow through the extractor without containing Panda usage.

## Import matching

`match_import_records(records, matchers)` filters raw import scan output against Panda category rules.

- **Default and side-effect imports never match.** TS does the same.
- **Type-only imports are skipped**, whether at declaration level (`import type { … }`) or specifier level
  (`import { type Foo }`).
- **Module match is substring.** `modules: ["panda/css"]` matches both `@my-org/panda/css` and `styled-system/css`. A
  pathologically short candidate (`"css"`) would over-match; `tests/import_map.rs` pins the category-priority order for
  overlap cases. This rule mirrors JS-side `ImportMap.match()` — diverging would silently break configs.
- **Categories are tried in fixed order**: css → tokens → recipe → pattern → jsx. First match wins.

## Resolver-gated extraction

The same-file `Resolver` (see [literal-evaluator](./literal-evaluator.md)) gates call-site and JSX extraction so a local
shadowing a Panda alias isn't treated as a Panda usage:

```js
import { css } from '@panda/css'
function f(css) {
  css({ color: 'red' })
} // not extracted
```

The resolver consults `oxc_semantic`'s symbol table; when the binding is _not_ an import, the call drops. Without a
resolver (staged entrypoints), we fall back to name-based matching — adequate for targeted tests but produces false
positives on shadowed names.

Unresolved symbols (free variables) conservatively count as imports. Such names typically refer to globals or implicit
imports the binder can't see; downstream alias lookup by name is authoritative.

## Parse-error contract

Oxc recovers from parse errors and returns a partial AST. Every entrypoint (`scan_imports`, `extract_calls`,
`extract_jsx`, `extract`) runs visitors on whatever AST Oxc produces, so a result can contain extractions _and_
non-empty `diagnostics` simultaneously.

**Treat `diagnostics` as authoritative.** Code that needs strict correctness should bail when `!diagnostics.is_empty()`.
Build pipelines that already tolerate ts-morph's recovery don't need to change behaviour — the partial-AST shape matches
what JS produced.

## Per-call costs

Each `extract()` allocates:

- One `oxc_allocator::Allocator` (cleared at end of call).
- One `Semantic` (if `matched` non-empty).
- One `Resolver` with an `FxHashMap` cache (if `matched` non-empty).
- One `VisitorContext` borrowing into the alias list.

For batch extraction across many files, the `Extractor` NAPI session class amortizes the matcher / token-dictionary
construction across calls. The per-file allocator and semantic build still happen for each file. See
[napi-boundary](./napi-boundary.md).

## Related

- [literal-evaluator](./literal-evaluator.md)
- [cross-file-resolution](./cross-file-resolution.md)
- [napi-boundary](./napi-boundary.md)
- [performance-budget](./performance-budget.md)
