# StyleTree

## Summary

The extractor attaches one `StyleTree` to each style object (`css()`, JSX, or a CVA base). The tree records span-backed
`Ternary`, `And`, and spread sites so transform can build class expressions without parsing the source again.
`StyleTree` and `style_lower` are the only path for conditional rewrites. The legacy `css_conditional` and
`jsx_conditional` source collectors are gone.

Encoding and NAPI `Literal` `data` both come from [`project_literal`](../crates/pandacss_extractor/src/style_tree.rs).
The extractor does not run a separate `expression_to_literal` walk over the same AST.

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

- **`#[serde(skip)]` on attach points** — `ExtractedCall::style_args` and `ExtractedJsx::style` stay inside Rust. The
  serialized NAPI `data` shape is unchanged.
- **Spans, not owned condition strings** — `test` is a `pandacss_shared::Span` into the file source. Tests assert the
  structure and spans; printers read the source during lowering.
- **`Branches`** — encode expands all arms (`Literal::Conditional`). Transform cannot rewrite them without a local
  condition span. Used for cross-file imports and `Literal` rehydration.
- **`Open`** — transform cannot rewrite it, and encode has no fallback. Used for unresolvable arms, computed properties,
  methods, accessors, and opaque spreads. `project_literal(Open)` returns `None`, so encode skips the property.
- **`OpenWithFallback`** — transform cannot rewrite it, but encode can use a known fallback. Used for dynamic left
  operands of `||` and `??`, and duplicate properties with an unresolved value. `project_literal(inner)` returns the
  fallback.

`StyleSpread` uses the same split. `Open` represents an opaque member or spread. `OpenWithFallback { fallback }`
represents dynamic `...(a || b)` and `...(a ?? b)`. Transform bails on both; encode merges a known fallback with
last-write-wins behavior.

Static inline object spreads merge into `entries` and do not consume a `StyleSpread` slot. JSX spread planning skips
them only when every source key is an extractable style prop; runtime-bearing or opaque spreads still bail.

`Ternary` and `And` record keys overwritten by later static entries. Lowering removes those keys from both branches to
preserve source-order overrides. For JSX, the transformer keeps runtime props and the generated class in the same
conditional branch. This preserves prop order and evaluates the condition once.

Conditional sites lower in source order against a base with rewritten paths removed. Overlapping paths bail because
independent atomic classes cannot represent object last-write-wins behavior.

## `project_literal`

Maps `StyleTree` to `Option<Literal>` for encoding:

| StyleTree                       | Literal                                         |
| ------------------------------- | ----------------------------------------------- |
| Ternary, both arms              | `Conditional([a,b])` (collapse if equal)        |
| Ternary, one arm `Open`         | the known arm only (encode-lenient)             |
| Branches                        | `Conditional([...])` (collapse if equal/single) |
| And                             | project `value` only (right-only peel)          |
| OpenWithFallback                | project inner (right-only peel for `\|\|`/`??`) |
| Open                            | `None`                                          |
| Object static entries           | merge last-wins                                 |
| `StyleSpread::Ternary` / `And`  | `combine_object_entry` like `spreadConditions`  |
| `StyleSpread::OpenWithFallback` | last-wins upsert of fallback object (like And)  |
| `StyleSpread::Open`             | skipped for encode                              |
| Leaves                          | 1:1 (`Token` keeps path)                        |

## Lower API

`pandacss_project::transform::style_lower`:

- `lower_style_tree(...) -> LowerResult { Static(String), Expr(ClassExpr), Bail }`
- `print_class_expr` for nested ternaries / multi-site `Join`
- Budget: at most 64 sites
- `Bail` on rewrite-critical `Open` / `OpenWithFallback`
- Paths: `PathSeg::{Key, Index}` (object keys + array slots)
- Nested bases keep static siblings and remove only rewritten leaves

## Binding resolution

`Resolver` keeps a `style_cache` beside the `Literal` cache:

| API                                 | Role                                                        |
| ----------------------------------- | ----------------------------------------------------------- |
| `resolve_identifier_style_tree`     | Same-file binding → `expression_to_style_tree(init)`        |
| `resolve_raw_style_call_style_tree` | `.raw({…})` via StyleTree                                   |
| Folder arms                         | `Identifier`, raw `CallExpression`, member / optional-chain |

Literal encoding drops spans for `Conditional` and right-only logical values. Transform needs those spans, so do not
rehydrate `Conditional` as `Open` for same-file style bindings.

Cross-file imports resolve to `Literal`, then `literal_to_style_tree` converts `Conditional` to `Branches`. Encoding
keeps every arm; transform does not rewrite foreign conditions. Destructuring reads `StyleTree` entries, and
spread-merged keys fall back to `Literal`.

## Attach points

| Surface                   | StyleTree                        | `data`            |
| ------------------------- | -------------------------------- | ----------------- |
| `css()` / pattern args    | `style_args`                     | `project_literal` |
| JSX style props           | `style`                          | `project_literal` |
| Tagged-template `css`     | `css_template_to_style_tree`     | `project_literal` |
| Vue/Svelte template attrs | `literal_to_style_tree` (static) | object entries    |

A missing StyleTree on a dynamic conditional is an extraction bug. Do not restore the source collectors.

## Transform contract (sole path)

1. Extraction builds a `StyleTree` for the style object (`style_args` or `style`).
2. Extraction sets `data = project_literal(&tree)` from that tree. It does not run a parallel `Literal` fold when
   attaching a call or JSX node. Leaf folding inside the `StyleTree` folder may still use `expression_to_literal`.
3. Transform:
   - A tree with rewrite sites uses `lower_style_tree`. `Static` and `Expr` rewrite the site. `Bail` keeps the original
     site instead of rewriting only its static parts.
   - A tree without rewrite sites uses the static or mixed `classes_for_css_args` and analyze path. Top-level open props
     may become `cx(static, css({…}))`; open spreads keep the call unchanged.
   - A missing tree uses the static path only.

With a dynamic left operand, `||` and `??` produce `OpenWithFallback(right)` when the right side folds. Transform bails,
while encode uses the right side for `data`. If the right side does not fold, the result is `Open`.

## Resolved questions

- **Q1 (flipped):** `StyleTree` is the only IR for conditional transforms. The source-parsing collectors are removed.
- **Q2 (resolved):** Extraction builds one `StyleTree` for each style object, and encoding sets `data` with
  `project_literal(StyleTree)`. `OpenWithFallback` lets encoding use the right operand of `||` or `??` while transform
  still bails.
- **Q3 (resolved):** Same-file bindings use a StyleTree cache. Array slots and nested bases are first-class in
  `style_lower`.
- **Q4 (resolved):** Cross-file conditionals use `Branches`: encode every arm and do not rewrite foreign conditions.
  Call `data` comes only from `project_literal(style_args)`, with no `Literal` fallback at attachment.

## Extending StyleTree

1. Attach `StyleTree` during extraction. Do not parse the source again during transform.
2. Handle identifiers, `.raw`, and members in the folder and resolver, not in a project-specific path.
3. When adding a path or site kind, update `PathSeg`, `Site`, `collect_*`, and `apply_branch` together.
4. Keep encoding in `project_literal`.

## Related

- [literal-evaluator](./literal-evaluator.md) — fold rules for `Literal` / non-style contexts
- [cross-file-resolution](./cross-file-resolution.md) — why StyleTree is not cached across files
- [transformer/README](./transformer/README.md) — transform planning
- [extraction-pipeline](./extraction-pipeline.md)
