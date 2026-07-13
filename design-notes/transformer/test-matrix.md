# Test matrix

The cases we need before we call the transformer stable.

## Summary

This matrix combines:

- Panda's earlier transform prototype tests
- cross-file resolver and evaluator edge cases relevant to Panda's scope
- Panda v2's current compiler and hook contracts

The goal is not to copy another project's implementation. The goal is to steal the failure cases that matter.

The earlier prototype matters here because it already covered the first generation of class-merge behavior. The `cx`
tests should inherit that corpus instead of replacing it.

## Current coverage (v2 branch)

| Layer                           | Location                             | Status            |
| ------------------------------- | ------------------------------------ | ----------------- |
| Rust transformer snapshots      | `crates/pandacss_project/tests/transform/` | via `cargo nextest run -p pandacss_project transform` |
| JS facade + runtime             | `packages/transformer/__tests__/`    | 14 tests passing  |
| Vite plugin                     | `packages/vite/__tests__/`           | 8 tests passing   |
| Host e2e / bundle-size fixtures | sandbox                              | not started       |

## Test layers

### 1. Rust transformer unit tests

No bundler. Pure inspect, plan, bailout, and helper-demand logic.

### 2. Binding and facade tests

Native and wasm boundary tests for the Rust transformer result shape.

### 3. Transformer snapshot tests

Input source -> transformed source.

### 4. Host adapter integration tests

Run against real bundler APIs.

### 5. Bundle-size fixtures

Measure whether helper mode and source transforms actually reduce built JS.

## Unit tests: `cx`

- `cx('a')` → `'a'`
- `cx('a', 'b')` → `'a b'`
- `cx('', 'a')` → `'a'`
- `cx(false, 'a')` → `'a'`
- `cx(null, undefined, 'a')` → `'a'`
- `cx(['a', ['b', false], 'c'])` → `'a b c'`
- `cx('a', 'a')` keeps duplicates
- `cx()` → `''`

Implemented in `packages/transformer/__tests__/cx.test.ts`.

## Unit tests: branch-compat merge behavior

These are the direct successors to the earlier prototype's `buildClassNameAttr(...)` behavior:

- no existing `className` -> static literal attribute
- existing quoted `className` folds to one static literal
- existing JSX expression can print inline concat form
- existing JSX expression can print helper-call form
- quoted `className` containing escaped content still prints safely

## Planner tests: helper decisions

- fully static JSX does not request helper
- dynamic `className` merge requests helper
- helper-eligible site still bails when spread props make rewrite unsafe
- recipe + atomic + existing className requests helper
- one helper-eligible site and one static site in the same file

## Planner tests: dynamic policy

- `css(...)` finite conditional rewrites to runtime string expression
- `css(...)` open-ended dynamic preserves original call
- `css(...)` conditional object rewrites when branch count stays small
- `css(...)` multiple independent conditionals bail once branch budget is exceeded
- JSX style prop finite conditional rewrites to runtime `className` expression
- JSX style prop open-ended dynamic bails whole element rewrite
- JSX style prop nested conditional object rewrites when branch count stays small
- JSX style prop multiple independent conditionals bail once branch budget is exceeded
- pattern function finite conditional rewrites to runtime string expression
- pattern function open-ended dynamic preserves original call
- pattern function conditional object rewrites when branch count stays small
- JSX pattern prop open-ended dynamic bails whole element rewrite
- JSX pattern prop nested conditional object rewrites when branch count stays small
- recipe function finite conditional variant rewrites to runtime string expression
- recipe function open-ended dynamic variant preserves original call
- recipe function conditional variant object rewrites when branch count stays small
- JSX recipe prop open-ended dynamic bails whole element rewrite
- JSX recipe prop nested conditional variant object rewrites when branch count stays small
- dynamic existing `className` alone does not cause bailout

## Binding and facade tests

- native binding returns stable `TransformResult` shape
- wasm binding returns the same semantic result shape
- JS facade forwards options without changing semantics
- dependency paths survive native or wasm boundary encoding
- diagnostics survive native or wasm boundary encoding
- helper-needed flag survives native or wasm boundary encoding
- if Phase 1 uses JS-side edit application, JS output matches Rust-plan snapshots exactly

## Snapshot tests: static rewrites

- simple `css({...})` call -> class string
- multiple `css({...})` calls
- responsive values
- shorthand properties
- multi-arg `css` with last-write-wins conflicts
- multi-arg `css` without conflicts
- pattern calls like `hstack()` and `vstack()`
- pattern calls with extra style props
- config recipe call with variants
- recipe default variants
- recipe overrides of default variants
- recipe with no variants
- boolean recipe variants
- token calls
- `token.var()` calls
- token fallback values
- token import aliases
- token inside `css`, template literals, `cva`, and mixed files

## Snapshot tests: bailout behavior

- dynamic `css` arg bails
- `.raw()` forms bail
- JSX spread props bail
- complex `as={condition ? A : B}` bail
- dynamic token path bails
- missing token without fallback bails
- helper does not force a partial rewrite after a bailout

## Snapshot tests: dynamic surfaces

- `css({ color: cond ? 'red.500' : 'blue.500' })`
- `css({ color: props.color })` keeps original call
- `css({ color: isError ? 'red.500' : 'blue.500', bg: isDark ? 'gray.900' : 'white' })`
- `css(isPrimary ? { color: 'blue.500', _hover: { color: 'blue.600' } } : { color: 'gray.700', _hover: { color: 'gray.800' } })`
- `hstack({ gap: cond ? '2' : '4' })`
- `hstack({ gap: props.gap })` keeps original call
- `hstack(isDense ? { gap: '2', align: 'center' } : { gap: '4', align: 'start' })`
- `button({ size: cond ? 'sm' : 'lg' })`
- `button({ size: props.size })` keeps original call
- `button(isMobile ? { size: 'sm', visual: 'solid' } : { size: 'lg', visual: 'outline' })`
- `<Box color={cond ? 'red.500' : 'blue.500'} />`
- `<Box color={props.color} />` bails whole JSX rewrite
- `<Box color={isError ? 'red.500' : 'blue.500'} _hover={{ color: isDark ? 'white' : 'black' }} />`
- `<HStack gap={cond ? '2' : '4'} />`
- `<HStack gap={props.gap} />` bails whole JSX rewrite
- `<HStack gap={isCompact ? '2' : '4'} justify={isWide ? 'space-between' : 'start'} />`
- `<Button size={cond ? 'sm' : 'lg'} />`
- `<Button size={props.size} />` bails whole JSX rewrite
- `<Button size={isMobile ? 'sm' : 'lg'} visual={isPrimary ? 'solid' : 'outline'} />`
- `<Button className={props.className} size="sm" />` still rewrites with helper or inline concat

## Snapshot tests: JSX rewriting

- `styled.div` -> `div`
- `styled.button` preserves tag and children
- `Box` -> `div`
- `as="section"` -> `section`
- `as="span"` with children
- `as={Foo}` -> `Foo`
- preserve non-style props
- preserve opening and closing tags
- skip matched JSX with no style props
- merge existing string `className` with static Panda classes
- merge existing dynamic `className` with static Panda classes using helper
- helper disabled chooses inline concat or no helper form
- JSX pattern components like `HStack`, `VStack`
- pattern-configured `jsxElement` like `linkOverlay -> a`
- JSX recipe elements with variants and leftover style props

## Snapshot tests: helper-vs-inline choice

- one dynamic `className` site where inline concat is smaller
- several dynamic `className` sites where helper is smaller
- file with helper candidate and fully static candidate
- helper import removed when later folding makes it unnecessary
- parity case from earlier prototype: one `className={expr}` plus one static Panda class
- parity case from earlier prototype: existing string `className` folds without helper

## Snapshot tests: dead import cleanup

- remove fully inlined `css` import
- remove fully inlined pattern import
- remove fully inlined JSX import
- remove fully inlined recipe import
- remove fully inlined token import
- partial named import removal
- keep live specifiers when only some calls were inlined
- preserve `import type`
- preserve non-Panda imports
- preserve imports when the transform bails

## Snapshot tests: conditionals

If conditional flattening stays in scope:

- simple ternary in `css`
- ternary with shared static props
- conditional whole-object selection in `css`
- nested conditional object selection in `css`
- repeated `&&` conditions
- nested selector conditionals
- `_hover` conditionals
- responsive array and object conditionals
- two-condition and three-condition trees
- branch-budget bailout on multi-conditional cross-product
- bail when dynamic branches make flattening unsafe

## Snapshot tests: `cva` and `sva`

- `cva()` helper output shape
- `cva` default variants
- `cva` compound variants
- callable `cva` result shape
- `cva.variantMap` and `variantKeys`
- `cva.raw()` bail
- `cva.splitVariantProps`
- `sva()` helper output shape
- slot keys on result
- `sva.variantMap`
- `sva.raw()` bail

## Integration tests: common host contract

Every host should cover:

- transformed build output compiles
- helper module resolves
- dead import cleanup holds in built output
- source maps exist
- file edits re-run transforms
- removing the last helper call also removes helper import on rebuild
- native Rust transformer output is the same across Vite, Rollup, webpack, and Rspack for equivalent inputs

## Integration tests: Vite and Rollup style hosts

- abstract helper import resolves to virtual internal ID
- helper `load` source is returned once per module graph
- HMR updates transformed modules correctly
- helper module stays stateless across edits
- earlier prototype parity: helper insertion happens after dead import cleanup
- earlier prototype parity: query-suffixed virtual IDs still resolve correctly

## Integration tests: webpack and Rspack style hosts

- loader returns code + source map
- helper import resolves through synthetic module or alias-backed runtime
- loader dependency registration rebuilds on watched file change
- helper module does not need manual dependency registration

## Cross-file resolution watch-list

If transformer scope grows beyond same-file static rewrites, add cases for:

- one-hop named import
- multi-hop re-export
- namespace re-export
- `export *` star export
- deep object paths
- negative numbers
- `as const`
- `satisfies`
- default export via local variable
- deeply nested objects
- template literal constants
- missing path in exported record
- star-export limit reached
- selector expected but constant or mixin found
- record/type mismatch while rebuilding nested exports
- missing export
- object path ends before scalar value
- circular re-export chains
- circular chains that include star exports
- loopback that should not count as a cycle
- unsupported export diagnostics with source snippets

These are the cross-file edge cases the transformer should eventually cover if its scope expands beyond same-file
rewrites.

## Build-time evaluator watch-list

If Panda adds executable build-time evaluation later, add cases for:

- plain TS evaluation
- plain JS evaluation
- transitive dependency tracking
- computed values
- syntax errors
- non-serializable exports
- absolute-path-only entry points
- excluding `node_modules` from tracked deps
- caching successes
- caching errors
- invalidating one dependent
- ignoring untracked invalidations
- retrying in-flight evaluation after invalidation
- cold-start invalidation before deps are known
- rebuilding reverse dependency graph
- multiple entry points sharing one dep
- double invalidation
- invalidate all
- concurrent evaluate calls
- reject calls after dispose

These are the build-time evaluation edge cases the transformer should eventually cover if Panda adds executable
evaluation.

## Bundle-size fixtures

Measure at least:

- one file with one preserved `className`
- many files with repeated preserved `className`
- recipe-heavy component set
- JSX-heavy component set
- mixed recipe + JSX + token case

The acceptance rule is simple:

- helper mode must reduce built JS bytes on repeated dynamic `className` cases
- static-only cases must not get bigger just because helper support exists
- Rust-side printing must not regress sourcemap fidelity versus the transition JS printer if both exist during rollout

## Acceptance bar

Do not ship helper mode on by default until we can show:

1. No known regression in the old Panda transform corpus.
2. Stable behavior for the cross-file and evaluator edge cases that match Panda's scope.
3. Real JS byte savings on repeated dynamic `className` cases.

## Related

- [Transformer](./README.md)
- [Platform support](./platform-support.md)
