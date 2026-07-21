# Literal Evaluator

## Summary

`pandacss_extractor::Literal` is the typed value the extractor reads out of source.
`expression_to_literal(expr, resolver)` folds an Oxc expression into a `Literal` when it resolves to a static value. The
fold rules match `ts-evaluator` semantics so the Rust extractor sees the same values the JS extractor sees — the goal is
parity with the JS path before defaulting to Rust.

Simple pure helpers are an intentional extension of that surface: v1 folded them incidentally via `ts-evaluator`; v2
lowers and applies a closed descriptor (`pure_fn.rs`) instead of running a JS interpreter.

## The Literal shape

```rust
pub enum Literal {
    String(String),
    Number(f64),
    Bool(bool),
    Null,
    Object(Vec<(String, Literal)>),  // insertion order preserved
    Array(Vec<Literal>),
    Conditional(Vec<Literal>),        // alternative branches
}
```

Three notable choices:

- **`Object` keeps keys in source order** as a `Vec`, not a map. Extraction never looks up by key; downstream code that
  does can build whatever index it needs. The order matters because Panda's encoder reads the deepest non-condition key
  as the property name.
- **`Number` is `f64`**, not split into int/float. JS only has one number type. The custom `Serialize` impl re-emits
  integers as `i64` when they fit (precision boundary at 2^53) to match the shape the JS extractor produces.
- **`Conditional`** carries alternative branches from a non-foldable **ternary** (both sides resolved independently);
  the downstream encoder expands every branch (see `atomic-encoding.md`). Logical operators don't produce it — a
  non-foldable `&&` / `||` / `??` resolves to its right operand instead. Serializes as
  `{ "kind": "conditional", "branches": [...] }` so downstream consumers can distinguish it from a regular object.

## What folds (with a Resolver)

Production `extract()` paths always supply a `Resolver`, which unlocks identifier-dependent folds. The full set:

- **String / number / boolean / null literals** — Primitive cases.
- **`ObjectExpression`** — Lenient per-member: unresolvable props/spreads are skipped; static siblings stay. Drops only
  when every member is unresolvable. Static spreads last-win; conditional spreads (`...(cond ? a : b)`) accumulate
  per-branch keys (node `spreadConditions` parity).
- **`ArrayExpression`** — Unresolvable / `undefined` elements become `null` slots (responsive index preserved).
  Unresolvable spread drops the whole array.
- **`ParenthesizedExpression`, `TSAsExpression`, `TSSatisfiesExpression`, `TSNonNullExpression`, `TSTypeAssertion`,
  `TSInstantiationExpression`** — Syntactic no-ops; recurse on the inner expression.
- **`UnaryExpression`** — `+`, `-`, `!`, `~`. Skips `typeof`, `void`, `delete`.
- **`BinaryExpression`** — Arithmetic, comparison, equality. JS `+` keeps the string-vs-number split.
- **`LogicalExpression`** — `&&`, `||`, `??`. Foldable left short-circuits; non-foldable left emits the right operand
  (`cond && X` → `X`).
- **`ConditionalExpression`** — Foldable test picks a branch; open test emits `Conditional` with both branches.
- **`TemplateLiteral`** — Including tagged templates (tag identity ignored).
- **`Identifier`** — Same-file `const` / `let` / `var` with literal initializer, never mutated.
- **`StaticMemberExpression`, `ComputedMemberExpression`** — After the object folds to a literal.
- **Computed object keys** — When the key expression folds to a string or number (including nested condition objects).
- **Object / array destructuring** — Renames, computed binding keys, defaults, and rest.
- **`ChainExpression` (`a?.b`)** — Transparent unwrap; short-circuit → `None`.
- **`token(...)` / `token.var(...)`** — Via `TokenDictionary` when the callee binds to a Panda `tokens` import.
- **Panda `.raw(...)` calls** — `css.raw`, `cva.raw`, pattern raw helpers when the import category matches.
- **Pure local / imported callables** — See [Pure callables](#pure-callables) below.
- **TS enums** — `Literal::Object` from member initializers; auto-incremented members drop.
- **Function-parameter `TSTypeLiteral`** — `function f(x: { color: 'red' })` lets `x.color` fold from the type members.

## What doesn't fold

- Free identifiers (no scope binding).
- `let` / `var` after any mutation.
- Function parameters without a `TSTypeLiteral` annotation.
- A ternary where the non-foldable test's branches can't both fold (a partial conditional drops rather than emit a
  half-branch). A logical operator whose right operand doesn't fold.
- Objects where _every_ member is unresolvable (a partially-static object keeps the static members; see the lenient
  `ObjectExpression` rule above — this matches the JS extractor, e.g. `sva({ slots: [...anatomy.keys()], base })` keeps
  `base` and infers slots).
- Impure or unsupported callables (async/generator, rest/destructured params, nested unknown calls, `this`, assignment,
  `Math.random`, etc.). Bare function values (`css({ color: getColor })` without a call) stay non-Literal.
- BigInt, template literal types, unary-prefixed type literals.
- Anything we don't recognize yet (`typeof`, `Object.keys`, enums whose declaration site isn't a `VariableDeclarator`,
  …).

Without a `Resolver` (staged entrypoints used in tests), every identifier-dependent expression collapses to `None` —
only purely literal expressions fold.

## JS semantics encoded in code

Several functions encode JS coercion rules directly. The rules matter because mis-coercing during constant folding would
silently produce different CSS than the JS extractor does.

- **`coerce_to_string`** — `String(x)` for the literals we model. Returns `None` for object / array / conditional rather
  than emit `"[object Object]"`.
- **`coerce_to_number`** — `Number(x)`. Returns `None` where JS would yield `NaN` rather than emit a value that doesn't
  round-trip through JSON.
- **`strict_eq`** / **`loose_eq`** — `===` and `==` for the literal subset. Cross-type strict comparisons are always
  `false`; mixed object/array `==` returns `None` because we don't model `ToPrimitive`.
- **`less_than`** — lexicographic for two strings, otherwise numeric with `ToNumber`. NaN comparisons drop.
- **`truthy`** — `null` and empty string are false; objects, arrays, and conditionals are always true (reference
  identity in JS).

Edge-case drops worth noting: division by zero (`1 / 0` would be `Infinity` in JS) returns `None` rather than emit
`Infinity` into a style, which doesn't round-trip through JSON.

## Pure callables

`call_to_literal` also folds calls whose callee lowers to an `OwnedPureFn` (`pure_fn.rs`):

1. Lower an arrow / function / IIFE to a closed descriptor (`OwnedPureExpr` body + param names).
2. Fold each argument to a `Literal`.
3. Apply the body with those args.

Captures that aren't parameters must already fold; they bake into the descriptor as `OwnedPureExpr::Value` at lower
time. Lowering fails on async/generators, rest or destructured params, nested unknown calls, `this`, assignment, and
other impure forms. Bare function values used without a call stay non-`Literal`.

Same-file bindings go through the resolver's `fn_cache`. Imported / re-exported helpers come from `CrossFileResolver` as
`ExportEntry::PureFn` (see [cross-file-resolution](./cross-file-resolution.md)) — lowered while the export file's AST is
live, then applied at the call site with local args.

## Scope resolution (`Resolver`)

`Resolver` wraps `oxc_semantic` and adds:

- Per-symbol memo of resolved literals (`FxHashMap<SymbolId, …>`). Keys are u32 newtypes — `SipHash` overhead would be
  pure waste.
- A parallel StyleTree memo (`style_cache`) for same-file style bindings — see [style-tree](./style-tree.md).
- A `ResolutionState::InProgress` cycle guard against `const a = b; const b = a;`.
- An alias table mapping local names back to their matched Panda import, used by `resolve_token_call`.

`is_import_binding` is the gate that prevents shadowed names from extracting:

```js
import { css } from '@panda/css'
function f(css) {
  css({ color: 'red' })
} // dropped
```

Unresolved symbols (free variables) return `true` — typically globals or implicit imports the binder can't see;
downstream alias lookup is authoritative.

## Cross-file fallthrough

When `resolve_symbol` hits an `Import` flag, it hands off to the `CrossFileResolver` (see
[cross-file-resolution](./cross-file-resolution.md)). Walking from the symbol's declaration node up to its
`ImportDeclaration` recovers `(specifier, imported_name)`, then the resolver loads the target file and folds the named
export. Re-export chains and file-local alias chains are followed through the target file's own resolver. Default and
namespace imports drop here.

## Token-call capture for tooling

`resolve_token_call` lowers `token('colors.red.500')` to the token's value and `token.var('…')` to its `var(--…)` — so
once folded, the **path is erased** from the extracted literal. The `Resolver` therefore records each resolved call's
`(path, span)` into a `token_refs` side-channel (sibling to the deprecation channel), surfaced on `ExtractUsage` behind
`#[serde(skip)]` so it stays in-process and never crosses the binding boundary or the hot path's wire. On-demand tooling
(`Project::usages`) consumes it to attribute `token()` usage back to a token path; the build path ignores it. The other
reference forms — bare category values (`color: 'red.300'`, incl. `/opacity` modifiers), curly `{colors.red.200}`, and
whole-value token paths — survive folding as text and are classified directly from the extracted value.

## Related

- [extraction-pipeline](./extraction-pipeline.md)
- [style-tree](./style-tree.md) — transform-facing IR (`Ternary` / `And` / spans); encode still uses `Literal` via `project_literal`
- [cross-file-resolution](./cross-file-resolution.md)
- [performance-budget](./performance-budget.md)
