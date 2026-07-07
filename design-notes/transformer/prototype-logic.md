# Prototype logic

Behavior we proved in the earlier prototype, written as implementation guidance — not branch history.

## Summary

The prototype did not ship a dedicated `cx` helper yet. It did establish the pieces we kept:

1. file-local runtime injection only when needed
2. JSX `className` merge rules
3. dead-import cleanup before helper injection
4. single-file orchestration with a stable pass order

We moved that logic into `crates/pandacss_transformer` (print) and `@pandacss/transformer` (runtime delivery).

## Single-file transform shape

Prototype flow:

1. create one `MagicString`
2. run target-specific inline passes
3. track helper demand
4. remove dead Panda imports
5. inject helper import
6. return rewritten code plus source map

Pass order:

1. `css()`
2. patterns
3. `cva()` / `sva()` / `styled()`
4. JSX style props
5. dead import cleanup
6. internal css import sync

Dead import cleanup runs after rewrites. Helper import sync runs after cleanup. Helper demand is collected during
rewriting, not with a second parse.

v2 implements the same order in Rust via `build_transform_edits` + one `string_wizard` pass.

## Helper delivery

Prototype injected private runtime source into the file. v2 emits a host-neutral import and serves runtime from a
virtual module:

```ts
import { cx as __pcx } from '@pandacss-internal/css'
```

`@pandacss/transformer` bundles `cx`, `css`, `cva`, and `sva` for that module. Only symbols the file uses are imported.

## `className` merge logic to preserve

- no existing `className` → static `className="..."`
- existing string `className` → fold to one static string at build time
- existing expression → inline concat or `__pcx(...)` depending on fragment count and `helper.cx` mode

Static + static: one literal, no helper. One dynamic + one static Panda fragment: inline concat often wins. Several
fragments or multiple expressions: `cx` is cleaner.

## Why `cx` is the join helper

Inline concat works for simple cases:

```tsx
<Box className={props.className} mt="4" />
```

→

```tsx
<div className={props.className + ' mt_4'} />
```

It stops scaling when the printer must merge dynamic `className`, recipe classes, variant classes, atomic leftovers, and
conditional fragments. One tiny join helper beats ad hoc concat at every rewrite site.

## Bailout rules to preserve

- bail on spread attributes
- bail on complex `as={condition ? A : B}`
- bail when style props contain unresolvable conditionals
- skip JSX elements that matched but have no style props
- per-element JSX bail (not whole-file bail) when one site is unsafe

## Dead-import cleanup rules to preserve

1. remove Panda imports only after rewrites are applied
2. do not treat import names inside emitted class strings as live bindings

Contract:

- fully inlined imports disappear
- partially live imports narrow
- `import type` stays untouched
- non-Panda imports stay untouched
- bailout cases keep their imports

v2 uses Oxc import spans plus `local_binding_used` on projected source, not regex-only scanning.

## Virtual-module pattern to preserve

Split between user-facing specifier and resolved internal ID. Preserve query suffixes when matching.

Today:

- source import: `@pandacss-internal/css`
- resolved internal ID: `\0pandacss:internal:css`

## Mapping into `@pandacss/transformer`

| Prototype                   | v2                                                            |
| --------------------------- | ------------------------------------------------------------- |
| single-file orchestrator    | `transform_source` in Rust; `transformSource` in JS           |
| per-target inline functions | `plan.rs`, `jsx.rs`, `recipe_inline.rs`, `styled.rs`, …       |
| helper-needed booleans      | `TransformHelperFacts` (`needs_cx`, `needs_cva`, `needs_sva`) |
| direct helper prepend       | `plan_internal_css_prepend` + `string_wizard` prepend         |
| JSX concat branch           | `helper.rs` merge + `__pcx` emission                          |

## What not to copy literally

- host-specific injection in the shared transformer layer
- prepend-only helper delivery as the only model
- regex-only import cleanup when spans are available
- host-specific naming in the shared contract

Copy the behavior contract. The packaging changed.

## Design rule for `cx`

`className` merging belongs in the shared printer (`helper.rs`), not in Vite-only or JSX-only code paths. Any
transformed site can request `__pcx` once the planner marks it safe.

## Related

- [Transformer](./README.md)
- [Platform support](./platform-support.md)
- [Test matrix](./test-matrix.md)
