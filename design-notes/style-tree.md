# StyleTree

## Summary

`StyleTree` is a Rust-internal IR attached during extract for style objects
(`css()` / JSX / cva base). It carries span-backed `Ternary` / `And` / spread
sites so the transformer can lower to class expressions without re-parsing
source. **StyleTree + `style_lower` is the sole transform conditional rewrite
path** — the legacy `css_conditional` / `jsx_conditional` source collectors are
removed.

Extract builds **one** StyleTree per style object. Encode and NAPI `Literal`
`data` come from [`project_literal`](../crates/pandacss_extractor/src/style_tree.rs)
of that tree — not a parallel `expression_to_literal` walk of the same AST.

## Shape

```rust
pub enum StyleTree {
    String(String),
    Number(f64),
    Bool(bool),
    Null,
    Token { path: String, value: String },
    Object(StyleObject),
    Array(Vec<StyleTree>),
    Ternary { test: Span, consequent: Box<StyleTree>, alternate: Box<StyleTree> },
    And { test: Span, value: Box<StyleTree> },
    Branches(Vec<StyleTree>), // span-less (cross-file / Literal::Conditional)
    Open,
    OpenWithFallback(Box<StyleTree>),
}
```

- **`#[serde(skip)]` on attach points** — `ExtractedCall::style_args`, `ExtractedJsx::style`. Never
  crosses the binding boundary; NAPI serialized `data` shape is unchanged.
- **Spans, not owned condition strings** — `test` is a `pandacss_shared::Span` into the file source.
  Tests assert structure + spans; printers slice source at lower time.
- **`Branches`** — encode expands all arms (`Literal::Conditional`); transform cannot rewrite (no
  local test). Used for cross-file imports and Literal rehydrate.
- **`Open`** — transform-strict bail with no encodeable fallback (unresolvable arms, bare rest).
  `project_literal(Open)` is `None` (property skipped for encode).
- **`OpenWithFallback`** — dynamic `||` / `??` left when the right folds. Transform treats it like
  `Open` (bail / block silent static). Encode peels via `project_literal(inner)`.

`StyleSpread` mirrors this: `Open` (bare rest) vs `OpenWithFallback { fallback }` for
`...(a || b)` / `...(a ?? b)` — transform bails; encode last-wins merges the fallback object.

## `project_literal`

Maps StyleTree → `Option<Literal>` with **encode semantics**:

| StyleTree                         | Literal                                      |
| --------------------------------- | -------------------------------------------- |
| Ternary, both arms                | `Conditional([a,b])` (collapse if equal)     |
| Ternary, one arm `Open`           | the known arm only (encode-lenient)          |
| Branches                          | `Conditional([...])` (collapse if equal/single) |
| And                               | project `value` only (right-only peel)       |
| OpenWithFallback                  | project inner (right-only peel for `\|\|`/`??`) |
| Open                              | `None`                                       |
| Object static entries             | merge last-wins                              |
| `StyleSpread::Ternary` / `And`    | `combine_object_entry` like `spreadConditions` |
| `StyleSpread::OpenWithFallback`   | last-wins upsert of fallback object (like And) |
| `StyleSpread::Open`               | skipped for encode                           |
| Leaves                            | 1:1 (`Token` keeps path)                     |

## Lower API

`pandacss_project::transform::style_lower`:

- `lower_style_tree(...) -> LowerResult { Static(String), Expr(ClassExpr), Bail }`
- `print_class_expr` for nested ternaries / multi-site `Join`
- Budget: max 64 sites
- `Bail` on rewrite-critical `Open` / `OpenWithFallback`
- Paths: `PathSeg::{Key, Index}` (object keys + array slots)
- Nested bases keep static siblings; only rewrite leaves are stripped

## Binding resolution

`Resolver` has a `style_cache` beside the Literal cache:

| API | Role |
| --- | --- |
| `resolve_identifier_style_tree` | Same-file binding → `expression_to_style_tree(init)` |
| `resolve_raw_style_call_style_tree` | `.raw({…})` via StyleTree |
| Folder arms | `Identifier`, raw `CallExpression`, member / optional-chain |

Literal encode drops spans (`Conditional` / right-only logicals). Transform needs the
span-backed tree — don't rehydrate `Conditional` → `Open` for same-file style bindings.

Cross-file: import resolves to Literal, then `literal_to_style_tree` (`Conditional` →
`Branches`). Encode keeps every arm; transform does not rewrite foreign tests. Destructuring
walks StyleTree entries; spread-merged keys fall back to Literal.

## Attach points

| Surface | StyleTree | `data` |
| --- | --- | --- |
| `css()` / pattern args | `style_args` | `project_literal` |
| JSX style props | `style` | `project_literal` |
| Tagged-template `css` | `css_template_to_style_tree` | `project_literal` |
| Vue/Svelte template attrs | `literal_to_style_tree` (static) | object entries |

Missing StyleTree on a dynamic conditional is an extract attach bug — don't bring back
source collectors.

## Transform contract (sole path)

1. Extract builds StyleTree for the style object (`style_args` / `style`).
2. Extract sets `data = project_literal(&tree)` from that tree only (no parallel Literal fold at
   call/JSX attach). Leaf folding inside the StyleTree folder may still use `expression_to_literal`.
3. Transform:
   - StyleTree present + rewrite sites → `lower_style_tree`; on `Static`/`Expr` rewrite; on
     `Bail` leave the site (do not silent-static-rewrite).
   - StyleTree present, no rewrite sites → static / mixed `classes_for_css_args` + analyze path
     (top-level open props may become `cx(static, css({…}))`). Open *spreads* leave the call.
   - StyleTree absent → static path only.

`||` / `??` with dynamic left: StyleTree is `OpenWithFallback(right)` when right folds (transform
bail; encode peels right into `data`). Bare `Open` when right does not fold.

## Resolved questions

- **Q1 (flipped):** StyleTree is the sole transform conditional IR; source-parse collectors retired.
- **Q2 (resolved):** StyleTree-first extract — one AST folder for style objects; encode `data` =
  `project_literal(StyleTree)`. `OpenWithFallback` carries `||` / `??` right-operand peel for encode
  while transform still bails.
- **Q3 (resolved):** Same-file bindings use a StyleTree cache. Array slots and nested bases
  are first-class in `style_lower`.
- **Q4 (resolved):** Cross-file conditionals use `Branches` (encode all arms; no foreign rewrite).
  Call `data` is only `project_literal(style_args)` — no attach-site Literal fallback.

## Extending StyleTree

1. Attach StyleTree at extract — don't re-parse in transform.
2. Ident / `.raw` / members → folder + resolver, not a project one-off.
3. New path/site kinds → update `PathSeg` / `Site` / `collect_*` / `apply_branch` together.
4. Encode stays `project_literal`.

## Related

- [literal-evaluator](./literal-evaluator.md) — fold rules for `Literal` / non-style contexts
- [cross-file-resolution](./cross-file-resolution.md) — why StyleTree is not cached across files
- [transformer/README](./transformer/README.md) — transform planning
- [extraction-pipeline](./extraction-pipeline.md)
