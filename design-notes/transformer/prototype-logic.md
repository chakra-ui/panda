# Prototype logic

The behavior we already proved in the earlier prototype, rewritten here as implementation guidance rather than branch
history.

## Summary

The earlier prototype did **not** yet have a dedicated `cxm` or `cn` helper.

What it did have was the exact precursor design we should build from:

1. file-local runtime helper injection for generated helpers
2. concrete JSX `className` merge rules
3. dead-import cleanup before helper injection
4. a single-file transform orchestrator with a stable pass order

Those pieces are the logic we want to preserve while moving to a host-neutral `packages/transformer` package.

## Single-file transform shape

The prototype transform worked like this:

1. create one `MagicString`
2. run target-specific inline passes
3. track whether helper code is needed
4. remove dead Panda imports
5. inject helper source
6. return rewritten code plus a high-resolution source map

The pass order was effectively:

1. `css()`
2. patterns
3. `cva()`
4. `sva()`
5. config recipes
6. JSX style props
7. `token()`
8. `token.var()`
9. dead import cleanup
10. helper injection

That sequencing matters:

- dead import cleanup must run after rewrites
- helper injection must run after dead import cleanup
- helper demand should be collected during rewriting, not with a second parse

## Helper delivery precedent

The prototype already injected private runtime helper code only when the transformed file needed it.

Important characteristics:

- helpers were private implementation details
- helpers were emitted only on demand
- helpers were intentionally tiny
- helper code used broad-compatibility syntax and avoided fragile initialization ordering

That is the right precedent for `cn`. The main architectural change is delivery:

- earlier prototype: inject helper source directly into the transformed file
- new design: emit a host-neutral internal import and let the bundler adapter serve the helper module

## `className` merge logic we should preserve

The prototype already had explicit `className` merge behavior:

- no existing `className` print a plain static `className="..."`
- existing string `className` fold at build time to one static string
- existing expression `className={expr}` print an inline concat form

That is the first real decision tree for the future `cn` helper.

The new printer should preserve those semantics:

- static + static fold to one literal, no helper
- dynamic expression + one static Panda fragment compare inline concat against helper call
- dynamic expression + several static or conditional Panda fragments helper becomes more attractive

## Why `cn` is the natural next step

Inline concat is enough for a simple case such as:

```tsx
<Box className={props.className} mt="4" />
```

which can become:

```tsx
<div className={props.className + ' mt_4'} />
```

That approach stops scaling cleanly once the printer needs to merge:

- existing dynamic `className`
- recipe base classes
- recipe variant classes
- atomic leftovers
- optional conditional fragments

At that point one tiny join helper is cleaner than growing ad hoc concat printers in many rewrite sites.

## Bailout rules we should preserve

The prototype already had important safety rules:

- bail on spread attributes
- bail on complex `as={condition ? A : B}`
- bail when style props contain conditionals the flattener cannot resolve
- skip JSX elements that matched but have no actual style props

Those rules belong in the new transform planner, not in host adapters.

## Dead-import cleanup rules we should preserve

The prototype's import cleanup had two key constraints:

1. remove Panda imports only after rewrites are applied
2. do not get tricked by import names appearing inside emitted class strings

The exact string-scanning approach used in the prototype should not automatically become the final shared
implementation, but the contract is correct:

- fully inlined imports should disappear
- partially live imports should be narrowed
- `import type` should remain untouched
- non-Panda imports should remain untouched
- bailout cases should keep their imports

## Virtual-module logic we should preserve

The prototype already used a clear split between:

- unresolved user-facing IDs
- resolved internal IDs

It also preserved query suffixes when matching internal virtual modules.

That pattern should carry forward for Vite and Rollup helper resolution:

- source import: `@pandacss-internal/transformer/cn`
- resolved internal ID: `\0pandacss:transformer:cn`

## How this maps into `packages/transformer`

Map the earlier prototype into the new package like this:

- top-level single-file orchestration becomes `transformSource(...)`
- per-target inline functions become `targets/*` plus `plan/*` and `print/*`
- helper-needed booleans become file-level helper demand tracked by planner and printer
- direct helper injection becomes internal helper import insertion
- JSX concat branch becomes the `cn` helper decision point

## What not to copy literally

The earlier prototype is a behavior reference, not a packaging reference.

Do not copy these details unchanged:

- host-owned helper injection mechanics into the shared transformer layer
- direct helper-source prepend as the only delivery model
- regex-only import cleanup if compiler spans give us a safer path
- host-specific naming in the shared transformer contract

Copy the behavior contract. Rebuild the packaging.

## Design rule for `cn`

The clearest rule preserved from the prototype is:

- merging `className` belongs in the shared printer

Not in:

- Vite-specific code
- JSX-only code paths
- recipe-only code paths

`cn` should be one private, shared print primitive that any transformed site can request once the planner marks it safe.

## Related

- [Transformer](./README.md)
- [Platform support](./platform-support.md)
- [Test matrix](./test-matrix.md)
