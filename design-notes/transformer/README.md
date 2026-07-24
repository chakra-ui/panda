# Transformer

Host-neutral source transforms for Panda. Rust owns semantics; `@pandacss/transformer` is the thin JS facade.

## Summary

Panda's Vite plugin started as CSS-root and HMR wiring. The next step is real source transforms:

- `css({...})` → class string
- pattern calls → class string
- recipe calls → class string (inline `cva` / `sva` / `styled` where safe)
- JSX style props → rewritten JSX with static classes

Most of that compiles to plain strings. Some sites cannot. The usual case is JSX with a dynamic `className` that also
needs Panda classes. For those, the transformer emits a tiny private `cx` helper that only joins class fragments it
produced.

This note covers the Rust transform module inside `pandacss_project`, the `@pandacss/transformer` package, the internal
runtime module contract, and how bundler adapters plug in.

## Current state

What ships on the v2 branch today:

| Piece                                   | Status                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------ |
| `pandacss_project::transform`           | Inspect, plan, print, dead-import cleanup, helper import sync                        |
| `Project::transform_source_with`        | Same `ParseTransforms` bag as `parse_file_with` (pattern / source / utility)         |
| Rust printer                            | Single `string_wizard::MagicString` pass; v3 source map on changed output            |
| `@pandacss/transformer`                 | `transformSource`, host-neutral hooks, internal runtime, optional `unplugin` exports |
| `@pandacss/vite` / `webpack` / `rollup` | CSS-root, codegen, and HMR by default; source rewrite via `transform: true`          |
| Internal runtime module                 | `@pandacss-internal/css` → `\0pandacss:internal:css`; symbols injected on demand     |

Runtime symbols today: `cx as __pcx`, `cva as __pcva`, `sva as __psva`. Inline `cva()` / `sva()` / `styled()` rewrites
bail when per-slot variant classes would diverge (runtime expects one shared string per option).

Options and bindings use `helper.cx` and `needsCx` / `needsCva` / `needsSva` for internal runtime demand.

## Canonical scope

This folder owns:

- the `pandacss_project::transform` module shape (`Project::transform_source` / `transform_source_with`)
- the `@pandacss/transformer` (`packages/transformer`) facade shape
- the private `cx` helper and internal css runtime module
- the abstract `@pandacss-internal/css` import ID
- the host adapter model
- the transformer test matrix

It does not own:

- compiler extraction internals
- CSS emission
- public runtime APIs
- bundler-specific package naming decisions outside the transformer contract

Related notes:

- [Hooks](../hooks.md)
- [Compiler lifecycle](../compiler-lifecycle.md)
- [Output & host layer (Driver)](../output-and-host-layer.md)
- [Extraction pipeline](../extraction-pipeline.md)
- [StyleTree](../style-tree.md) — span-backed extract IR for conditional class lowering
- [Prototype logic](./prototype-logic.md)

## Problem

There are three separate problems to solve:

1. Panda does not yet have a host-neutral source-transform layer.
2. The bundler-specific code should not each reimplement the same transform planner.
3. The compiler already owns parse and extraction, so a Node-only transformer would duplicate compiler semantics.
4. Some transformed call sites still need a runtime join, but we do not ship a public `cx` (or `cn`) utility in
   `styled-system/`.

If we solve only the Vite case, we will hard-code Vite assumptions into the transform contract. That would make later
webpack, Rspack, Rollup, or Rolldown support more expensive than it needs to be.

## Goals

1. Put transform semantics in `pandacss_project::transform` (same façade as parse / class-name resolution).
2. Keep `@pandacss/transformer` as a thin facade for host-facing ergonomics.
3. Keep bundler packages thin. They adapt host APIs, not transform semantics.
4. Keep the `cx` helper private and tiny.
5. Allow the transform to choose between:
   - plain string literals
   - inline concat
   - helper calls
6. Support the same transform contract on:
   - Vite
   - Rollup
   - Rolldown
   - webpack
   - Rspack

## Non-goals

1. Replacing `clsx`, `tailwind-merge`, or similar as a user-facing utility.
2. Putting `cx` in generated `styled-system/`.
3. Adding runtime class conflict merging.
4. Keeping unsafe transforms alive by routing them through the helper.

## Why a Rust core

The core transformer should live in Rust, not just in a Node package.

Why:

- the compiler already owns parse, extraction, token resolution, JSX matching, and diagnostics
- cross-file dependency tracking belongs next to compiler project state
- a Rust core can ship through both native and wasm compiler bindings
- transform semantics then live beside the AST and inspection data instead of being reconstructed in TS

If we keep the real planner in JS long-term, we create a second compiler beside the compiler.

## Why `@pandacss/transformer`

`@pandacss/transformer` is the JS package name. It is internal-first and not a user-facing styled-system surface.

Its job:

- call the Rust transformer through `@pandacss/compiler`
- expose `transformSource` and host-neutral plugin hooks
- own internal runtime source (`cx`, `css`, `cva`, `sva`) served from `@pandacss-internal/css`
- optionally wrap hooks with `unplugin` for Rollup/webpack-style hosts

Transform semantics stay in Rust. Bundler packages depend on `@pandacss/transformer`, not the other way around.

## Package boundaries

`pandacss_project::transform` should be internal-first. `@pandacss/transformer` should also be internal-first. Neither
should promise a stable public API yet.

The Rust crate depends on:

- existing Rust compiler crates
- Oxc spans and diagnostics
- `string_wizard` for edit application and source maps

The Rust crate does not depend on Vite, Rollup, webpack, Rspack, or Rolldown.

`@pandacss/transformer` depends on:

- `@pandacss/compiler` or `@pandacss/compiler-wasm`
- `@pandacss/compiler-shared`
- `unplugin` (adapter only; not part of the transform contract)

It does not depend on bundler packages.

## Recommended split

The recommended architecture is:

```txt
pandacss_project::transform
  - plan / apply / resolve / imports / helper
  - recipe_inline (cva/sva/styled)
  - style_lower (StyleTree conditionals), jsx.rs + jsx-*.rs
  - Project::transform_source / transform_source_with (+ ParseTransforms)

@pandacss/transformer  (packages/transformer)
  - transformSource → compiler binding
  - createPandaSourcePluginHooks (resolveId / load / transform)
  - runtime/internal (cx, css, cva, sva bundled for virtual module)
  - pandaTransformer — optional unplugin wrapper

@pandacss/vite | @pandacss/rollup | @pandacss/webpack | future rspack package
  - host hooks, watch, HMR
  - call @pandacss/transformer; resolve @pandacss-internal/css
  - Rolldown runs @pandacss/rollup unchanged; Turbopack is blocked on CSS aggregation
```

## The package shape

At a high level, the transformer design owns four things:

1. **Target matching**
2. **Transform planning**
3. **Code printing**
4. **Private helper metadata**

Implemented layout:

```txt
crates/pandacss_project/src/transform/
  mod.rs, plan.rs, apply.rs, resolve.rs, imports.rs, helper.rs
  recipe_inline.rs, style_lower.rs, jsx_skip.rs
  jsx.rs, jsx-element.rs, jsx-runtime.rs,
  jsx-parse.rs, jsx-shared.rs

packages/transformer/src/
  index.ts, transform.ts, hooks.ts, plugin.ts
  runtime/internal/   # cx, css, cva, sva, load, ids
```

## The three-phase model

The transformer should run in three phases. The long-term goal is for all three phases to live in Rust, but Phase 1 can
temporarily keep printing in JS if that gets us to a correct implementation faster.

### Phase 1: inspect

The Rust transformer asks the compiler for the information it needs from one source file:

- extracted calls
- extracted JSX entries
- diagnostics
- token lookups
- recipe and pattern metadata

This should reuse the compiler's existing source of truth, not build a second parser stack.

The first implementation should lean on the compiler inspection boundary we already have instead of re-parsing in a JS
package. In practice that means extending the compiler boundary with a transform-facing entry point or reusing
`inspectFileSource(path, source)` plus resolved config metadata from the existing host pipeline.

The current Rust implementation carries transform-only module, call, JSX, property, and expression facts beside the
serialized extraction result. They are compact owned records backed by original-source spans, not cloned AST nodes.
Planning uses those facts for call shape, precedence, static keys, import liveness, and helper placement. Source slicing
is reserved for copying text at an Oxc-provided span. Only `extract_for_transform` retains this payload; normal
extraction avoids the extra allocations.

### Phase 2: plan

The Rust transformer converts compiler output into a host-neutral plan:

```ts
interface TransformPlan {
  rewrites: Rewrite[]
  importsToDrop: ImportDrop[]
  dependencies: string[]
  diagnostics: Diagnostic[]
  helper: {
    needsCx: boolean
    candidateSites: number
  }
  bailed: boolean
}
```

The plan is where we decide:

- whether a site is static
- whether a site must bail
- whether a site can use inline concat
- whether a site is allowed to request the helper

No host APIs belong here.

### Phase 3: print

The printer applies the plan to source text and returns:

```ts
interface TransformOutput {
  code: string
  map: SourceMapLike | null
  dependencies: string[]
  imports: {
    needsCx: boolean
  }
}
```

The printer is also responsible for:

- folding adjacent literals
- dead import cleanup
- helper-vs-inline size comparison
- final helper import insertion

## Printer strategy

Printing lives in Rust.

`pandacss_project::transform` collects rewrites, import edits, and helper prepends into one edit list, then applies them
with `string_wizard::MagicString` and emits a v3 source map when output changes.

That keeps plan decisions, edit application, dead-import cleanup, helper import sync, and source maps on the same side
of the boundary as the planner.

`@pandacss/transformer` does not re-apply edits in JS. It forwards `transformSource` to the compiler binding and serves
the bundled internal runtime for `@pandacss-internal/css`.

## Proposed package API

The root API should stay deliberately small:

```ts
interface TransformRequest {
  path: string
  source: string
  compiler: PandaTransformerBinding
  options: TransformerOptions
}

interface TransformResult {
  code: string
  map: SourceMapLike | null
  changed: boolean
  bailed: boolean
  diagnostics: Diagnostic[]
  dependencies: string[]
  helper: {
    needsCx: boolean
    needsCva: boolean
    needsSva: boolean
  }
}

declare function transformSource(request: TransformRequest): TransformResult
```

Important boundaries:

- the JS facade accepts source text and a transformer binding
- it does not accept a Vite plugin context, a webpack loader context, or a Rollup plugin object
- it reports dependency paths, but does not register them with any host directly
- helper facts in bindings: `needsCx`, `needsCva`, `needsSva` — which internal runtime symbols the rewritten file uses

Suggested binding shape:

```ts
interface PandaTransformerBinding {
  transformSource(path: string, source: string, options?: TransformerOptions): TransformResult
}
```

## What the planner should know

The planner needs enough information to make stable choices, but it should stay dumb about bundlers.

It should know:

- source file path
- source text
- resolved Panda config metadata
- compiler extraction / inspection results
- transformer options

It should not know:

- how Vite resolves a virtual module
- how webpack injects a synthetic module
- how Rollup caches module loads

## Host plugins vs transformer options

Bundler plugins (`@pandacss/vite`, `@pandacss/webpack`, `@pandacss/rollup`) default to CSS injection, codegen, and
HMR/watch only. Source rewrite is opt-in:

```ts
pandacss() // CSS + codegen + HMR
pandacss({ transform: true }) // also rewrite source
```

The host option is a boolean. Advanced knobs (`targets`, `helper`, `include` / `exclude`) stay on
`@pandacss/transformer` / `transformSource`. Do not confuse the unused internal `TransformerOptions.mode`
(`'build' | 'serve'`) with Vite `command` / `mode` or webpack `mode` — hosts do not expose or auto-map it.

## The transformer options

Suggested shape for the low-level transformer (not the host plugin flag):

```ts
interface TransformerOptions {
  mode: 'build' | 'serve' // internal; unused by the planner today
  helper: {
    cx: false | true | 'auto'
  }
  targets?: {
    css?: boolean
    patterns?: boolean
    recipes?: boolean
    tokens?: boolean
    jsx?: boolean
  }
  include?: RegExp | RegExp[]
  exclude?: RegExp | RegExp[]
}
```

`targets` gates which categories rewrite. When the object is omitted (or every flag is unset), all of `css`, `jsx`,
`patterns`, and `recipes` are on by default — `grid()` / `stack()` and static `button()` calls inline alongside `css()`.
Setting any flag switches to opt-in: only the categories you enable run. Every category still bails to the runtime call
on anything dynamic, so the default is safe. `tokens` inlines static `token()` / `token.var()` calls to their resolved
value.

The helper flag starts simple:

- `false`: never emit the helper
- `true`: helper is allowed when it shrinks output
- `"auto"`: reserved for a later default if we prove it is safe

These options are transform semantics only. They intentionally say nothing about virtual modules, alias rules, HMR, or
loader ordering.

## The private helper contract

The class-merge helper is `cx`. Transformed source aliases it to `__pcx` so user `cx` bindings do not collide.

Recipe inlines use `cva as __pcva` and `sva as __psva` from the same internal module when those rewrites run.

Import shape in transformed code:

```ts
import { cx as __pcx } from '@pandacss-internal/css'
```

Hosts resolve that specifier to an internal module ID and return bundled runtime source from `@pandacss/transformer`
(today: `\0pandacss:internal:css`).

Only symbols the file uses are injected. A file with only `__pcva` gets `cva as __pcva`; a file with only static classes
gets no import.

### Why `@pandacss-internal/css`

One virtual module covers `cx`, `css`, `cva`, and `sva`. That matches the styled-system/css surface the inlines need,
without separate per-helper URLs.

Bare specifiers work across Vite, Rollup, webpack, and Rspack. Custom `virtual:` schemes do not.

### Why not put `cx` in `styled-system`

It would become a public runtime API too early. The runtime is a transformer detail, not a stable user contract.

## The helper behavior

The helper only joins the shapes the transformer emits:

```ts
type PandaClassPart = string | false | null | undefined | PandaClassPart[]
```

Behavior:

- skip falsy non-string values
- skip `""`
- flatten nested arrays
- preserve order
- keep duplicates
- do not sort
- do not merge conflicts
- do not inspect class semantics

The first version should stay boring:

```ts
export function cx(...parts: PandaClassPart[]): string {
  let out = ''

  for (const part of parts) {
    if (!part) continue

    if (Array.isArray(part)) {
      const value = cx(...part)
      if (!value) continue
      out = out ? out + ' ' + value : value
      continue
    }

    out = out ? out + ' ' + part : part
  }

  return out
}
```

We can flatten the implementation later if benchmarks say it matters.

This helper is the direct successor to the earlier prototype's JSX class merge logic. The difference is packaging:

- old branch: inline concat lived inside the JSX printer
- new design: helper use is a printer choice; runtime resolves through `@pandacss-internal/css`

## When the planner may request `cx`

The helper is for the narrow cases that survive build-time erasure.

Good candidates:

- JSX already has a dynamic `className`
- JSX merges recipe classes, atomic classes, and preserved user `className`
- one rewrite naturally produces nested arrays of class fragments

Examples:

```tsx
<Box className={props.className} color="red.500" />
```

```tsx
<div className={__pcx(props.className, 'c_red.500')} />
```

```tsx
<Button className={props.className} size="sm" color="red.500" />
```

```tsx
<button className={__pcx(props.className, 'button button--size_sm', 'c_red.500')} />
```

## When the planner must not request `cx`

The helper does not justify unsafe transforms.

Still bail on:

- JSX spread props we cannot reason about
- complex `as={condition ? A : B}` rewrites
- dynamic style arguments we cannot fold
- source shapes that would need object-class semantics

Also do not use the helper when:

- the output is fully static
- two string literals can be folded at build time
- inline concat is smaller than helper import + helper call

When `helper.cx` is `false`, helper-eligible sites should still be marked so the printer can fall back to inline concat
where safe.

## Helper-vs-inline choice

This choice belongs in the printer, not the planner.

The planner says:

- this site is eligible for helper use

The printer compares:

1. helper import + helper calls
2. inline concat / ternary form

Then it emits the smaller file-level result.

That gives us one clean rule:

- planner decides safety
- printer decides size

## Dynamic input policy

See also [StyleTree](../style-tree.md) for the extract-time IR that replaces source re-parse for finite conditionals
(`Ternary` / `And` / spreads); open-ended dynamic remains `Open` → bail.

Yes, this needs to be considered explicitly. The transformer should not use one blanket rule for every dynamic input.

The policy should be surface-specific.

### Rule 1: preserve semantics before maximizing erasure

If a site cannot be rewritten without changing runtime behavior, the transformer must bail for that site.

Do not partially rewrite a site unless the residual runtime semantics are still correct.

### Rule 2: distinguish finite dynamic from open-ended dynamic

There are two different kinds of "dynamic":

- **finite dynamic** The source is dynamic at runtime, but every branch is statically known at build time.
- **open-ended dynamic** The runtime value is not statically enumerable by the transformer.

Examples:

```ts
const cls = css({ color: isError ? 'red.500' : 'green.500' })
```

This is finite dynamic.

```ts
const cls = css({ color: props.color })
```

This is open-ended dynamic.

The transformer may rewrite finite dynamic. It must bail on open-ended dynamic unless there is a dedicated runtime
contract for that surface.

### Rule 3: finite dynamic still needs normalization limits

Not every finite conditional should be rewritten automatically.

Multiple finite conditionals can produce:

- nested ternaries
- conditionals inside nested objects
- independent conditionals whose branch combinations form a cross-product

Examples:

```ts
css({
  color: isError ? 'red.500' : 'green.500',
  bg: isDark ? 'gray.900' : 'white',
})
```

and:

```ts
css(
  isPrimary
    ? { color: 'blue.500', _hover: { color: 'blue.600' } }
    : { color: 'gray.700', _hover: { color: 'gray.800' } },
)
```

Both are finite dynamic, but they are not equally cheap to print.

The planner should therefore normalize conditionals before deciding to rewrite:

1. lift conditional leaves or conditional objects into explicit branch alternatives
2. flatten each branch into class fragments
3. measure branch count and expression complexity
4. rewrite only if the resulting expression stays within a bounded complexity budget

If normalization produces too many branches or a shape the printer cannot express cleanly, treat it as effectively
unrewriteable for that surface.

### Rule 4: use a branch budget

The transformer should have a branch budget for finite dynamic rewrites.

The exact number can be tuned later, but the design should assume:

- one simple ternary is cheap
- a small nested conditional tree may still be acceptable
- a cross-product of multiple independent conditionals should bail once the expression stops being predictable

That keeps output readable, keeps sourcemaps tractable, and avoids shipping transforms that technically work but are too
large or too fragile to be worth it.

### `css(...)`

#### Safe to rewrite

- fully static objects
- finite conditional expressions where every branch resolves to a static class fragment
- conditional object literals where each branch resolves to a static class fragment
- merges where static and finite-conditional fragments can be printed as a runtime string expression
- multiple finite conditionals when normalization stays within the branch budget

Example direction:

```ts
css({ color: isError ? 'red.500' : 'green.500' })
```

can become:

```ts
isError ? 'c_red.500' : 'c_green.500'
```

or a concatenated expression if several fragments are involved.

#### Must bail

- `props.color`, `themeColor`, `someMap[key]`, or any other open-ended runtime value
- object spreads the planner cannot fully resolve
- dynamic keys
- `.raw()` forms
- normalized branch trees that exceed the branch budget

Important rule:

- for `css(...)`, open-ended dynamic means preserve the original `css(...)` call

That is safe because the runtime function already exists on that surface.

### JSX style props

This surface is stricter than `css(...)`.

For JSX style props, the transform often rewrites:

- `<Box ... />` -> `<div className="..." />`
- `<styled.button ... />` -> `<button className="..." />`

That means unresolved style props cannot simply be left behind, because `color`, `mt`, `gap`, and similar props are not
valid DOM styling semantics on the rewritten intrinsic element.

#### Safe to rewrite

- fully static style props
- finite conditional style props where every branch resolves to known classes
- conditional object values and nested condition wrappers when normalization stays within the branch budget
- dynamic existing `className` merges, handled with inline concat or `cx`

#### Must bail

- unresolved style prop values such as `color={props.color}`
- unresolved pattern-style props such as `gap={props.gap}`
- unresolved object spreads
- complex `as={...}` expressions the printer cannot preserve safely
- nested or multiple conditionals whose normalized branch tree exceeds the branch budget

Important rule:

- for JSX style props, open-ended dynamic style props should bail the whole JSX element rewrite

That is stricter than `css(...)` on purpose.

### Pattern function calls

Pattern function calls such as `hstack(...)` follow the same broad rule as `css(...)`.

#### Safe to rewrite

- fully static props
- finite conditional props whose branches each resolve to known pattern output
- conditional object props when normalization stays within the branch budget

#### Must bail

- open-ended runtime props such as `hstack({ gap: props.gap })`
- `.raw()` forms
- unresolved spreads or dynamic keys
- normalized branch trees that exceed the branch budget

Important rule:

- for pattern function calls, open-ended dynamic should preserve the original pattern call

### JSX pattern props

JSX pattern elements such as `<HStack gap="4" />` behave like JSX style props, not like function calls.

#### Safe to rewrite

- fully static props
- finite conditional props that can be lowered into known class expressions
- nested conditional prop objects when normalization stays within the branch budget

#### Must bail

- open-ended runtime props such as `<HStack gap={props.gap} />`
- unresolved spreads
- normalized branch trees that exceed the branch budget

Important rule:

- if unresolved pattern props remain, bail the whole JSX pattern rewrite

### Recipe function calls

Recipe function calls sit between `css(...)` and JSX recipe elements.

#### Safe to rewrite

- fully static variant objects
- finite conditional variant expressions when every branch maps to known recipe classes
- conditional variant objects when normalization stays within the branch budget
- static leftover style props on recipes when those leftovers can be encoded as atomic classes

#### Must bail or preserve runtime call

- open-ended variant values such as `button({ size: props.size })`
- unresolved spreads
- `.raw()` forms
- normalized branch trees that exceed the branch budget

Important rule:

- if the original recipe function runtime remains valid on that surface, preserve the original call instead of forcing a
  lossy rewrite

This is also where the existing recipe dynamic diagnostic matters:

- dynamic recipe variants already have a documented warning surface in
  [Recipe variant dynamic diagnostics](../recipe-variant-diagnostics.md)

The transformer should align with that contract, not invent a conflicting one.

### JSX recipe props

JSX recipe elements are the strictest recipe surface.

When rewritten, they usually become intrinsic elements plus `className`. Once that happens, unresolved recipe props
cannot be left on the element as if they still had Panda runtime meaning.

#### Safe to rewrite

- fully static variant props
- finite conditional variant props whose branches map to known classes
- conditional prop objects and nested condition wrappers when normalization stays within the branch budget
- static leftover style props
- dynamic existing `className` merge via inline concat or `cx`

#### Must bail

- open-ended variant props such as `<Button size={props.size} />`
- open-ended leftover style props
- unresolved spreads
- normalized branch trees that exceed the branch budget

Important rule:

- if unresolved recipe props remain, bail the whole JSX recipe rewrite

### Summary matrix

| Surface               | Finite dynamic                                                             | Open-ended dynamic             | Default policy               |
| --------------------- | -------------------------------------------------------------------------- | ------------------------------ | ---------------------------- |
| `css(...)`            | rewrite to expression if normalized tree stays within budget               | preserve original call         | partial rewrite allowed      |
| pattern function call | rewrite to expression if normalized tree stays within budget               | preserve original call         | partial rewrite allowed      |
| recipe function call  | rewrite to expression if normalized tree stays within budget               | usually preserve original call | partial rewrite allowed      |
| JSX style props       | rewrite if every dynamic branch is enumerable and tree stays within budget | bail whole element             | no unresolved residual props |
| JSX pattern props     | rewrite if every dynamic branch is enumerable and tree stays within budget | bail whole element             | no unresolved residual props |
| JSX recipe props      | rewrite if every dynamic branch is enumerable and tree stays within budget | bail whole element             | no unresolved residual props |

This is the key distinction:

- function-call surfaces can often preserve their original runtime call
- JSX-to-intrinsic rewrites cannot safely leave unresolved Panda props behind

## Host ownership

The bundler packages should own only host APIs:

- `@pandacss/vite`
- `@pandacss/rollup` (also runs unchanged under Rolldown)
- `@pandacss/webpack`
- future `@pandacss/rspack`

Each host package should:

1. pick source files to transform
2. call `@pandacss/transformer`
3. resolve `@pandacss-internal/css`
4. wire watch / invalidation hooks
5. expose host-native tests

The host package should not:

1. decide transform semantics
2. decide helper behavior
3. duplicate dead-import cleanup
4. maintain its own rewrite planner

## Internal module responsibilities

Responsibility split today:

- **Rust (`pandacss_project::transform`)** — plan rewrites, apply edits (`string_wizard`), dead-import cleanup, sync
  internal css import, `cx` merge printing for JSX.
- **`@pandacss/transformer`** — `transformSource` binding, host-neutral hooks, bundled runtime for
  `@pandacss-internal/css`, optional `unplugin` wrapper.
- **Host packages (e.g. `@pandacss/vite`)** — wire hooks, watch, HMR; do not own transform semantics.

Canonical internal specifier: `@pandacss-internal/css`. Resolved ID in Vite today: `\0pandacss:internal:css`.

## Dependency tracking

`TransformResult.dependencies` is reserved for extra watch edges the transform discovers.

Same-file transforms will often return an empty array. That field still matters because:

1. webpack and Rspack need explicit dependency registration
2. future cross-file constant resolution will need watch edges

The transformer only reports paths. The host adapter turns those into `this.addDependency`, `addWatchFile`, or the
equivalent host-native primitive.

## Implementation phases

### Done (v2 branch)

- `pandacss_project::transform` with css, jsx, recipes, patterns, styled/cva/sva inlines
- Rust printing via `string_wizard` + source maps
- `@pandacss/transformer` facade and internal css virtual module
- Vite transform hooks (CSS-root and HMR remain in `@pandacss/vite`)
- `cx` behind `helper.cx` option

### Next

- Rollup adapter on the same contract
- webpack / Rspack loader or plugin path
- Rolldown parity validation
- Sandbox e2e across hosts

## Why this structure matters

If we keep the planner in Vite first and copy it later, we will drift:

- Vite fixes will not automatically apply to webpack
- webpack edge cases will not automatically improve Rollup
- test coverage will fragment by host

One transformer package plus thin host adapters keeps correctness work shared.

## Test strategy

This folder keeps the full matrix in [test-matrix.md](./test-matrix.md).

At a high level:

1. transformer unit tests
2. transformer snapshot tests
3. host adapter integration tests
4. bundle-size fixtures

## Platform support

The host-specific adapter design lives in [platform-support.md](./platform-support.md).

## Prototype reference

The earlier implementation details that informed this design live in [prototype-logic.md](./prototype-logic.md). That
file captures the behavior contract without tying the design note to branch history.

## Unresolved questions

- Should `@pandacss/transformer` stay internal-only, or do we expect third-party host adapters?
- Should helper choice compare raw bytes or minified bytes?
- Should `Rspack` be a separate package, or a thin wrapper over the webpack adapter?
- Should `Rolldown` be a separate package, or a thin wrapper over the Rollup adapter?

## Related

- [Platform support](./platform-support.md)
- [Test matrix](./test-matrix.md)
- [Prototype logic](./prototype-logic.md)
- [Hooks](../hooks.md)
- [Compiler lifecycle](../compiler-lifecycle.md)
- [Output & host layer (Driver)](../output-and-host-layer.md)
