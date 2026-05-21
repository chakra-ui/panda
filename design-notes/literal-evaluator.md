# Literal Evaluator

## Summary

`pandacss_extractor::Literal` is the typed value the extractor reads out of source.
`expression_to_literal(expr, resolver)` folds an Oxc expression into a `Literal` when it resolves to a static value. The
fold rules match `ts-evaluator` semantics so the Rust extractor sees the same values the JS extractor sees — the goal is
parity with the JS path before defaulting to Rust.

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
- **`Conditional`** carries alternative branches from a non-foldable ternary or logical expression — both sides resolved
  independently. Serializes as `{ "kind": "conditional", "branches": [...] }` so downstream consumers can distinguish it
  from a regular object.

## What folds (with a Resolver)

Production `extract()` paths always supply a `Resolver`, which unlocks identifier-dependent folds. The full set:

| Form                                                                                                                                        | Notes                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| String / number / boolean / null literals                                                                                                   | Primitive cases.                                                                                                     |
| `ObjectExpression` / `ArrayExpression`                                                                                                      | Including spreads when the source resolves to a matching literal.                                                    |
| `ParenthesizedExpression`, `TSAsExpression`, `TSSatisfiesExpression`, `TSNonNullExpression`, `TSTypeAssertion`, `TSInstantiationExpression` | Syntactic no-ops — recurse on the inner expression.                                                                  |
| `UnaryExpression`                                                                                                                           | `+`, `-`, `!`, `~`. Skips `typeof`, `void`, `delete`.                                                                |
| `BinaryExpression`                                                                                                                          | Arithmetic, comparison, equality. JS `+` keeps the string-vs-number split.                                           |
| `LogicalExpression`                                                                                                                         | `&&`, `\|\|`, `??`. Non-foldable test emits `Conditional` branches.                                                  |
| `ConditionalExpression`                                                                                                                     | Ternary. Non-foldable test emits `Conditional` branches.                                                             |
| `TemplateLiteral`                                                                                                                           | Including tagged templates — tag identity is ignored.                                                                |
| `Identifier`                                                                                                                                | Same-file `const` / `let` / `var` with literal initializer, never mutated.                                           |
| `StaticMemberExpression`, `ComputedMemberExpression`                                                                                        | After resolving the object to a literal.                                                                             |
| Computed object keys                                                                                                                        | When the key expression folds to a string or number, including nested condition objects.                              |
| Object / array destructuring                                                                                                                | Including renamed properties, computed binding keys, defaults, and object/array rest.                                |
| `ChainExpression` (`a?.b`)                                                                                                                  | Transparent unwrap; short-circuit yields `None`.                                                                     |
| `CallExpression` for `token(...)` / `token.var(...)`                                                                                        | Resolved via the `TokenDictionary` when the callee binds to a Panda `tokens` import.                                 |
| Panda `.raw(...)` calls                                                                                                                     | `css.raw`, `cva.raw`, and pattern raw helpers fold when the callee matches the configured import category.           |
| TS enums                                                                                                                                    | Synthesized into a `Literal::Object` from member initializers. Members without initializers (auto-incremented) drop. |
| Function-parameter `TSTypeLiteral`                                                                                                          | `function f(x: { color: 'red' })` lets `x.color` fold via the readonly literal type members.                         |

## What doesn't fold

- Free identifiers (no scope binding).
- `let` / `var` after any mutation.
- Function parameters without a `TSTypeLiteral` annotation.
- Conditional / logical operators where _neither_ side folds.
- Calls other than `token()` / `token.var()` and configured Panda `.raw()` helpers.
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

## Scope resolution (`Resolver`)

`Resolver` wraps `oxc_semantic` and adds:

- Per-symbol memo of resolved literals (`FxHashMap<SymbolId, …>`). Keys are u32 newtypes — `SipHash` overhead would be
  pure waste.
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

## Related

- [extraction-pipeline](./extraction-pipeline.md)
- [cross-file-resolution](./cross-file-resolution.md)
- [performance-budget](./performance-budget.md)
