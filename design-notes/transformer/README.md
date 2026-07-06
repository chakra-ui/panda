# Transformer

Host-neutral source transforms for Panda, centered on a Rust core and a tiny private runtime helper for the cases that
cannot be erased at build time.

## Summary

Panda's current Vite plugin is mostly a CSS root and HMR integration. The next step is real source transforms:

- `css({...})` -> class string
- pattern calls -> class string
- recipe calls -> class string
- token calls -> literal string
- JSX style props -> rewritten JSX with static classes

Most of that can compile away to plain strings. Some sites cannot. The common case is JSX that already has a dynamic
`className` prop and now needs Panda's generated classes added to it. For those cases we want one tiny private helper,
named `cn`, that only joins class fragments the transformer emits.

This note defines the Rust-core transformer architecture, the JS facade, the helper contract, and the bundler adapter
model for Vite, Rollup, Rolldown, webpack, and Rspack.

## Canonical scope

This folder owns:

- the `crates/pandacss_transformer` crate shape
- the `packages/transformer` facade shape
- the private `cn` helper contract
- the abstract helper import ID
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
- [Prototype logic](./prototype-logic.md)

## Problem

There are three separate problems to solve:

1. Panda does not yet have a host-neutral source-transform layer.
2. The bundler-specific code should not each reimplement the same transform planner.
3. The compiler already owns parse and extraction, so a Node-only transformer would duplicate compiler semantics.
4. Some transformed call sites still need a runtime join, but we do not want to ship a full public `cn` runtime.

If we solve only the Vite case, we will hard-code Vite assumptions into the transform contract. That would make later
webpack, Rspack, Rollup, or Rolldown support more expensive than it needs to be.

## Goals

1. Put transform semantics in one Rust crate: `crates/pandacss_transformer`.
2. Keep `packages/transformer` as a thin facade for host-facing ergonomics.
3. Keep bundler packages thin. They should adapt host APIs, not own transform semantics.
4. Make the `cn` helper private and tiny.
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

1. Replacing `clsx`, `tailwind-merge`, or `cnfast` as a user-facing utility.
2. Making `cn` part of generated `styled-system/`.
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

## Why keep `packages/transformer`

`packages/transformer` is still the right package name for the JS side.

Its job changes. It is no longer the semantic core. It becomes the thin facade that:

- calls the Rust transformer
- applies or serializes edits for host-facing output
- owns helper-source strings or runtime module text
- exposes a small JS API to bundler adapters
- hides NAPI or wasm binding details from hosts

## Package boundaries

`crates/pandacss_transformer` should be internal-first. `packages/transformer` should also be internal-first. Neither
should start with a public user-facing API promise.

The Rust crate should depend on:

- existing Rust compiler crates
- Oxc spans and diagnostics
- a string-edit and sourcemap utility suitable for Rust printing

The Rust crate should not depend on:

- Vite
- Rollup
- webpack
- Rspack
- Rolldown

`packages/transformer` should depend on:

- `@pandacss/compiler` or `@pandacss/compiler-wasm`
- `@pandacss/compiler-shared`

It should not depend on bundler packages.

Bundler packages depend on `packages/transformer`, not the other way around.

## Recommended split

The recommended architecture is:

```txt
crates/pandacss_transformer
  - inspect
  - plan
  - bailout rules
  - helper demand
  - dependency tracking
  - abstract edits or rewrite IR

packages/transformer
  - JS facade over native/wasm bindings
  - optional edit application if Phase 1 uses JS printing
  - helper module source text
  - host-facing `transformSource(...)` API

packages/vite | packages/rollup | packages/webpack | packages/rspack | packages/rolldown
  - host hooks
  - watch registration
  - helper-module resolution
  - source-map return shape expected by the host
```

## The package shape

At a high level, the transformer design owns four things:

1. **Target matching**
2. **Transform planning**
3. **Code printing**
4. **Private helper metadata**

Suggested internal layout:

```txt
crates/pandacss_transformer/
  src/
    lib.rs
    inspect.rs
    plan/
      mod.rs
      build_plan.rs
      helper_usage.rs
      bailouts.rs
    print/
      mod.rs
      edits.rs
      imports.rs
      jsx.rs
      helpers.rs
    targets/
      mod.rs
      css_call.rs
      pattern_call.rs
      recipe_call.rs
      token_call.rs
      jsx_style.rs
      jsx_pattern.rs
      jsx_recipe.rs

packages/transformer/
  src/
    index.ts
    native.ts
    wasm.ts
    ids.ts
    options.ts
    apply/
      apply-edits.ts
      sourcemap.ts
    runtime/
      cn.ts
    testing/
      fixtures.ts
      snapshots.ts
```

This is a shape, not a file-by-file commitment.

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

### Phase 2: plan

The Rust transformer converts compiler output into a host-neutral plan:

```ts
interface TransformPlan {
  rewrites: Rewrite[]
  importsToDrop: ImportDrop[]
  dependencies: string[]
  diagnostics: Diagnostic[]
  helper: {
    needsCn: boolean
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
    needsCn: boolean
  }
}
```

The printer is also responsible for:

- folding adjacent literals
- dead import cleanup
- helper-vs-inline size comparison
- final helper import insertion

## Printer strategy

We should explicitly separate the target architecture from the rollout architecture.

### Target architecture

Printing lives in Rust.

That keeps:

- edit decisions
- edit application
- sourcemap generation
- dead-import cleanup

on the same side of the boundary as the planner.

### Rollout architecture

Phase 1 may still apply Rust-produced edits in JS if that is the shortest path to something correct. In that shape:

- Rust returns abstract edits plus helper facts
- `packages/transformer` applies those edits and generates the host-facing source map

That is acceptable only as a transition state. The semantic source of truth still needs to be Rust.

## Rust string-editing engine

Rolldown already maintains a Rust crate named `string_wizard` with a `MagicString` type and optional sourcemap support.
That makes it a strong candidate for Panda's Rust-side printer.

Use it as a candidate, not a locked commitment yet.

Why it is promising:

- it is built for string editing
- it exposes a `MagicString` model
- it has sourcemap support
- it is already used in a production-grade Rust bundler project

Adoption rule:

- prefer `string_wizard` if its edit model and sourcemap fidelity match Panda's transform needs
- otherwise keep the Rust transformer printer abstract enough to swap the underlying edit engine

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
    needsCn: boolean
  }
}

declare function transformSource(request: TransformRequest): TransformResult
```

Important boundaries:

- the JS facade accepts source text and a transformer binding
- it does not accept a Vite plugin context, a webpack loader context, or a Rollup plugin object
- it reports dependency paths, but does not register them with any host directly
- the only helper fact hosts need is whether `cn` must be resolvable in the rewritten file

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

## The transformer options

Suggested shape:

```ts
interface TransformerOptions {
  mode: "build" | "serve"
  helper: {
    cn: false | true | "auto"
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

The helper flag starts simple:

- `false`: never emit the helper
- `true`: helper is allowed when it shrinks output
- `"auto"`: reserved for a later default if we prove it is safe

These options are transform semantics only. They intentionally say nothing about virtual modules, alias rules, HMR, or
loader ordering.

## The private helper contract

The helper should be called `cn`.

The import in transformed code should always be aliased to an internal local name:

```ts
import { cn as __pcn } from "@pandacss-internal/transformer/cn"
```

Why this exact shape:

- the export name is short
- the local alias avoids collisions with user `cn`
- the source import is a valid bare module specifier for every host
- the package-like prefix is easier to intercept than a `virtual:` or custom URL scheme

The bundler adapter then resolves that source ID to its own host-native internal ID.

### Why not `virtual:panda-internal/cn`

That works well in Vite and Rollup, but it pushes Vite/Rollup naming into the host-neutral contract.

webpack and Rspack work more naturally with bare specifiers, aliases, and synthetic modules than with custom URL-style
schemes. The abstract import should be the format that all hosts can intercept cleanly.

### Why not put `cn` in `styled-system`

Because it would become a public runtime API too early. The helper is a transformer detail, not a stable user-facing
contract.

## The helper behavior

The helper only joins the shapes the transformer emits:

```ts
type PandaClassPart =
  | string
  | false
  | null
  | undefined
  | PandaClassPart[]
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
export function cn(...parts: PandaClassPart[]): string {
  let out = ""

  for (const part of parts) {
    if (!part) continue

    if (Array.isArray(part)) {
      const value = cn(...part)
      if (!value) continue
      out = out ? out + " " + value : value
      continue
    }

    out = out ? out + " " + part : part
  }

  return out
}
```

We can flatten the implementation later if benchmarks say it matters.

This helper is the direct successor to the earlier prototype's JSX class merge logic. The difference is packaging:

- old branch: inline concat lived inside the JSX printer
- new design: helper use is a printer choice backed by one tiny shared runtime
- old branch: helpers were prepended as raw strings
- new design: helpers resolve through host adapters via an abstract internal import

## When the planner may request `cn`

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
<div className={__pcn(props.className, "c_red.500")} />
```

```tsx
<Button className={props.className} size="sm" color="red.500" />
```

```tsx
<button className={__pcn(props.className, "button button--size_sm", "c_red.500")} />
```

## When the planner must not request `cn`

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

When `helper.cn` is `false`, helper-eligible sites should still be marked by the planner so the printer can fall back to
inline concat where safe.

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

Yes, this needs to be considered explicitly. The transformer should not use one blanket rule for every dynamic input.

The policy should be surface-specific.

### Rule 1: preserve semantics before maximizing erasure

If a site cannot be rewritten without changing runtime behavior, the transformer must bail for that site.

Do not partially rewrite a site unless the residual runtime semantics are still correct.

### Rule 2: distinguish finite dynamic from open-ended dynamic

There are two different kinds of "dynamic":

- **finite dynamic**
  The source is dynamic at runtime, but every branch is statically known at build time.
- **open-ended dynamic**
  The runtime value is not statically enumerable by the transformer.

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
- dynamic existing `className` merges, handled with inline concat or `cn`

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
- dynamic existing `className` merge via inline concat or `cn`

#### Must bail

- open-ended variant props such as `<Button size={props.size} />`
- open-ended leftover style props
- unresolved spreads
- normalized branch trees that exceed the branch budget

Important rule:

- if unresolved recipe props remain, bail the whole JSX recipe rewrite

### Summary matrix

| Surface | Finite dynamic | Open-ended dynamic | Default policy |
| --- | --- | --- | --- |
| `css(...)` | rewrite to expression if normalized tree stays within budget | preserve original call | partial rewrite allowed |
| pattern function call | rewrite to expression if normalized tree stays within budget | preserve original call | partial rewrite allowed |
| recipe function call | rewrite to expression if normalized tree stays within budget | usually preserve original call | partial rewrite allowed |
| JSX style props | rewrite if every dynamic branch is enumerable and tree stays within budget | bail whole element | no unresolved residual props |
| JSX pattern props | rewrite if every dynamic branch is enumerable and tree stays within budget | bail whole element | no unresolved residual props |
| JSX recipe props | rewrite if every dynamic branch is enumerable and tree stays within budget | bail whole element | no unresolved residual props |

This is the key distinction:

- function-call surfaces can often preserve their original runtime call
- JSX-to-intrinsic rewrites cannot safely leave unresolved Panda props behind

## Host ownership

The bundler packages should own only host APIs:

- `@pandacss/vite`
- future `@pandacss/rollup`
- future `@pandacss/webpack`
- future `@pandacss/rspack`
- future `@pandacss/rolldown`

Each host package should:

1. pick source files to transform
2. call `packages/transformer`
3. resolve the internal `@pandacss-internal/transformer/cn` helper import
4. wire watch / invalidation hooks
5. expose host-native tests

The host package should not:

1. decide transform semantics
2. decide helper behavior
3. duplicate dead-import cleanup
4. maintain its own rewrite planner

## Internal module responsibilities

The package layout should map to clear responsibilities:

- `targets/*`
  Normalize compiler inspection facts into transformable target records.
- `plan/build-plan.ts`
  Produce rewrite or bailout decisions per target.
- `plan/helper-usage.ts`
  Aggregate helper candidates at file scope.
- `plan/bailouts.ts`
  Hold all "preserve original source" rules in one place.
- `print/apply-plan.ts`
  Apply all edits with one `MagicString` instance and generate the source map.
- `print/imports.ts`
  Remove dead Panda imports and inject the helper import if needed.
- `print/jsx.ts`
  Rewrite JSX tags and merge `className`.
- `print/helpers.ts`
  Compare inline concat against helper-call output when helper mode allows both.
- `runtime/cn.ts`
  Provide the tiny helper source every host will expose under its own internal module ID.
- `ids.ts`
  Own the canonical helper specifier `@pandacss-internal/transformer/cn`.

## Dependency tracking

`TransformResult.dependencies` is reserved for extra watch edges the transform discovers.

Same-file transforms will often return an empty array. That field still matters because:

1. webpack and Rspack need explicit dependency registration
2. future cross-file constant resolution will need watch edges

The transformer only reports paths. The host adapter turns those into `this.addDependency`, `addWatchFile`, or the
equivalent host-native primitive.

## Implementation phases

Ship this in stages:

### Phase 1

- create `crates/pandacss_transformer`
- expose it through `@pandacss/compiler`
- keep `packages/transformer` as the JS facade
- support `css`, patterns, recipes, tokens, and JSX rewrites
- support `cn` behind an option
- ship via Vite first

### Phase 2

- add Rollup on the same contract
- share the same transform snapshots between Vite and Rollup adapters
- decide whether JS-side edit application can be removed immediately

### Phase 3

- add webpack loader or plugin integration
- validate the same adapter shape on Rspack
- harden dependency tracking
- move printer and sourcemaps fully into Rust if Phase 1 shipped a JS printer

### Phase 4

- validate Rolldown parity
- decide whether Rollup compatibility is enough or a dedicated adapter is required

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

- Should `packages/transformer` remain internal-only, or do we expect third-party host adapters?
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
