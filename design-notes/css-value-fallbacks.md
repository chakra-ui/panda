---
title: Ordered CSS value fallbacks (`css.fallback`)
status: proposed
scope:
  - packages/types
  - packages/dev
  - packages/compiler-shared
  - crates/pandacss_codegen
  - crates/pandacss_extractor
  - crates/pandacss_encoder
  - crates/pandacss_utility
  - crates/pandacss_recipes
  - crates/pandacss_project
  - crates/pandacss_stylesheet
related:
  - atomic-encoding.md
  - style-tree.md
  - build-info.md
  - stylesheet.md
  - css-custom-functions.md
  - virtual-styled-system.md
---

# Ordered CSS value fallbacks (`css.fallback`)

## Summary

Panda should provide `css.fallback()` for emitting an ordered run of declarations for one property:

```ts
import { css } from '../styled-system/css'
import { progression } from '../styled-system/functions'

const className = css({
  width: css.fallback('75%', progression(3, 4)),
})
```

```css
.width_fallback_xxx {
  width: 75%;
  width: --progression(3, 4);
}
```

The fallback chain is one style value, one atom, and one class. Its declaration order is a CSS output contract.

This is a general progressive-enhancement primitive, not an `@function` feature. It can also pair a broadly supported
color with a newer color syntax, or a fixed value with `clamp()`:

```ts
css({
  color: css.fallback('#0057b8', 'oklch(55% 0.18 250)'),
  paddingInline: css.fallback('1rem', 'clamp(1rem, 4vw, 3rem)'),
})
```

This is a proposed feature. No part of it is implemented yet.

## Why an explicit wrapper is necessary

Arrays already mean responsive values:

```ts
css({
  width: ['100%', '50%'],
})
```

Panda cannot reinterpret a property array as duplicate declarations without breaking existing code. `css.fallback()`
makes the second meaning explicit:

```ts
css({
  width: css.fallback('100%', 'min(50rem, 100%)'),
})
```

Multiple normal atoms are also incorrect. Panda stores atoms in hash sets and sorts them independently. Class attribute
order does not decide which declaration wins in the stylesheet. The complete fallback chain must remain one ordered
value through extraction, encoding, build info, hydration, and emission.

## CSS semantics and limits

Fallback declarations work when the browser rejects a later declaration before it participates in the cascade:

```css
.card {
  color: #0057b8;
  color: oklch(55% 0.18 250);
}
```

They do not recover from every computed-value failure:

```css
.card {
  color: red;
  color: var(--possibly-invalid);
}
```

If the second declaration becomes invalid at computed-value time, the browser does not restart the cascade and recover
`red`; it applies the property's invalid-value behavior. `css.fallback()` preserves CSS semantics and must not promise a
JavaScript-style `try/catch`.

Custom-property declarations are excluded initially for the same reason:

```css
.card {
  --accent: #0057b8;
  --accent: oklch(55% 0.18 250);
  color: var(--accent);
}
```

Custom properties accept arbitrary token streams. An older browser can keep the second `--accent` declaration and only
discover the unsupported value when `var(--accent)` is substituted, too late to recover the first declaration.

## Goals

1. Emit duplicate property declarations in authored order.
2. Keep one fallback chain as one atomic class.
3. Keep responsive arrays unambiguous.
4. Support `css()`, JSX style props, `cva()`, `sva()`, config recipes, slot recipes, and patterns.
5. Preserve token and keyframe usage from every member.
6. Preserve fallback chains through source transforms and build-info hydration.
7. Keep runtime and Rust class names identical.
8. Prevent minifiers and declaration deduplication from dropping the baseline value.

## Non-goals

- Recovering from invalid-at-computed-value-time behavior.
- Supporting CSS custom-property declarations in the first version.
- Falling back between different properties, such as `display` and `-webkit-box`.
- Polyfilling unsupported values.
- Accepting dynamic, conditional, responsive, object, boolean, or null members initially.
- Supporting callback-backed multi-property utility transforms initially.
- Replacing `@supports` when feature detection is the clearer tool.

## Application API

### `css.fallback()`

`fallback` is a method on the generated `css` function:

```ts
const styles = css({
  width: css.fallback('75%', 'min(60rem, 100%)'),
})
```

The minimum arity is two:

```ts
css.fallback('75%', 'min(60rem, 100%)')
css.fallback('red', 'color(display-p3 1 0 0)', 'oklch(60% 0.2 30)')

// Type and compiler error: one value is not a fallback chain
css.fallback('75%')
```

Attaching the helper to `css` has three benefits:

- it communicates that the result is only meaningful inside a Panda style object,
- it avoids a new top-level import and extractor category,
- the extractor can recognize the existing `css` binding and reject shadowed lookalikes.

It is not a runtime CSS string:

```tsx
// Valid Panda JSX style prop
;<Box width={css.fallback('75%', 'min(60rem, 100%)')} />

// Invalid: React's style prop expects a CSS value, not Panda's marker
;<div style={{ width: css.fallback('75%', 'min(60rem, 100%)') }} />
```

### Marker shape

The generated helper returns an exact internal marker:

```ts
interface CssFallbackValue<T> {
  readonly __panda: 'fallback'
  readonly values: readonly [T, T, ...T[]]
}

function fallback<T>(first: T, second: T, ...rest: T[]): CssFallbackValue<T> {
  return {
    __panda: 'fallback',
    values: [first, second, ...rest],
  }
}
```

The string marker is intentional. It survives config serialization and works in generated JS, MJS, TS, NAPI, and WASM
hosts. Every decoder validates the exact object shape; arbitrary objects with extra keys are not treated as fallback
values.

Source extraction recognizes the binding-aware `css.fallback()` call directly. The marker is for generated runtime code,
`css.raw()`, pattern transforms, and config serialization.

### Responsive values

A fallback marker is a leaf inside a responsive array:

```ts
css({
  width: [css.fallback('100%', 'min(60rem, 100%)'), css.fallback('75%', 'min(70rem, 75%)')],
})
```

This emits one fallback chain at the base condition and another at the next breakpoint.

Arrays cannot be members of a fallback chain:

```ts
// Invalid
css.fallback(['100%', '75%'], ['min(60rem, 100%)', 'min(70rem, 75%)'])
```

The runtime style walker must stop at fallback markers before it applies responsive-array normalization.

### Conditions and selectors

Fallback chains work under normal Panda conditions:

```ts
css({
  color: {
    base: css.fallback('#111', 'oklch(20% 0.02 250)'),
    _dark: css.fallback('#fff', 'oklch(96% 0.01 250)'),
  },
  _hover: {
    color: css.fallback('#004080', 'oklch(48% 0.17 250)'),
  },
})
```

The condition belongs to the atom. Every declaration in its fallback run receives the same selector and wrappers.

### `!important`

All members must have the same importance:

```ts
css({
  width: css.fallback('75% !important', 'min(60rem, 100%) !important'),
})
```

Mixed importance is rejected:

```ts
// Invalid: the first declaration would always outrank the second
css.fallback('75% !important', 'min(60rem, 100%)')
```

The encoder strips the shared suffix and stores one atom-level `important` flag.

## Atomic recipes

### `cva()`

```ts
import { css, cva } from '../styled-system/css'

export const badge = cva({
  base: {
    color: css.fallback('#0057b8', 'oklch(55% 0.18 250)'),
  },
  variants: {
    visual: {
      solid: {
        backgroundColor: css.fallback('#0057b8', 'oklch(55% 0.18 250)'),
      },
      subtle: {
        backgroundColor: css.fallback('#e6f0ff', 'oklch(94% 0.04 250)'),
      },
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      visual: 'solid',
      disabled: true,
      css: {
        opacity: css.fallback(0.5, 'clamp(0.4, 0.5, 0.6)'),
      },
    },
  ],
})
```

The fallback chain remains one atom in base, variant, and compound styles.

### `sva()`

```ts
import { css, sva } from '../styled-system/css'

export const card = sva({
  slots: ['root', 'title', 'body'],
  base: {
    root: {
      width: css.fallback('100%', 'min(70rem, 100%)'),
      backgroundColor: css.fallback('#fff', 'oklch(99% 0.005 250)'),
    },
    title: {
      color: css.fallback('#111', 'oklch(20% 0.02 250)'),
    },
    body: {
      color: css.fallback('#444', 'oklch(38% 0.02 250)'),
    },
  },
})
```

Slot decomposition does not need a fallback-specific walker. It uses the same encoder as `css()` and `cva()`.

## Config recipes

Config recipes load before `styled-system/css` exists. They use a JSON-safe helper from `@pandacss/dev`:

```ts filename="button.recipe.ts"
import { cssFallback, defineRecipe } from '@pandacss/dev'

export const buttonRecipe = defineRecipe({
  className: 'button',
  base: {
    color: cssFallback('{colors.blue.700}', 'oklch(45% 0.16 250)'),
    paddingInline: cssFallback('1rem', 'clamp(1rem, 3vw, 2rem)'),
  },
  variants: {
    visual: {
      solid: {
        backgroundColor: cssFallback('{colors.blue.600}', 'oklch(55% 0.18 250)'),
      },
      subtle: {
        backgroundColor: cssFallback('{colors.blue.50}', 'oklch(96% 0.03 250)'),
      },
    },
    disabled: {
      true: {
        cursor: 'not-allowed',
      },
      false: {},
    },
  },
  compoundVariants: [
    {
      visual: 'solid',
      disabled: true,
      css: {
        opacity: cssFallback(0.5, 'clamp(0.4, 0.5, 0.6)'),
      },
    },
  ],
})
```

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'
import { buttonRecipe } from './button.recipe'

export default defineConfig({
  theme: {
    recipes: {
      button: buttonRecipe,
    },
  },
})
```

`cssFallback()` creates the same marker as generated `css.fallback()`. It does not evaluate or normalize values. Config
token references are resolved member by member during normal style lowering.

### Config slot recipes

```ts filename="card.recipe.ts"
import { cssFallback, defineSlotRecipe } from '@pandacss/dev'

export const cardRecipe = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'title', 'body'],
  base: {
    root: {
      width: cssFallback('100%', 'min(70rem, 100%)'),
      backgroundColor: cssFallback('{colors.white}', 'oklch(99% 0.005 250)'),
    },
    title: {
      color: cssFallback('{colors.gray.950}', 'oklch(20% 0.02 250)'),
    },
    body: {
      color: cssFallback('{colors.gray.700}', 'oklch(38% 0.02 250)'),
    },
  },
  variants: {
    density: {
      compact: {
        root: {
          padding: cssFallback('0.75rem', 'clamp(0.625rem, 2vw, 0.75rem)'),
        },
      },
      comfortable: {
        root: {
          padding: cssFallback('1rem', 'clamp(1rem, 3vw, 1.5rem)'),
        },
      },
    },
  },
})
```

Recipe build info stores the complete chain on one `RecipeStyleEntry`.

## Patterns

Patterns need support in two places: property inputs and transform output.

### Passing a fallback to a CSS-property pattern input

A pattern property declared with `type: 'property'` inherits that property's fallback-aware type:

```ts filename="panda.config.ts"
import { defineConfig, definePattern } from '@pandacss/dev'

const frame = definePattern({
  properties: {
    width: { type: 'property', value: 'width' },
  },
  transform(props) {
    return {
      width: props.width,
    }
  },
})

export default defineConfig({
  patterns: {
    extend: {
      frame,
    },
  },
})
```

```ts
import { css } from '../styled-system/css'
import { frame } from '../styled-system/patterns'

frame({
  width: css.fallback('100%', 'min(70rem, 100%)'),
})
```

The marker must remain an atomic leaf through pattern defaults, prop splitting, `mapObject`, and the generated pattern
transform.

Primitive pattern properties do not gain fallback values:

```ts
properties: {
  columns: { type: 'number' }, // number only, not CssFallbackValue<number>
}
```

### Constructing a fallback inside a pattern

`PatternHelpers` should gain `fallback` so config callbacks do not close over a generated module:

```ts filename="panda.config.ts"
import { defineConfig, definePattern } from '@pandacss/dev'

const fluidFrame = definePattern({
  properties: {
    baseline: { type: 'property', value: 'width' },
    enhanced: { type: 'property', value: 'width' },
  },
  defaultValues: {
    baseline: '100%',
    enhanced: 'min(70rem, 100%)',
  },
  transform(props, helpers) {
    return {
      width: helpers.fallback(props.baseline, props.enhanced),
    }
  },
})

export default defineConfig({
  patterns: {
    extend: {
      fluidFrame,
    },
  },
})
```

```ts
fluidFrame({
  baseline: '100%',
  enhanced: 'min(70rem, 100%)',
})
```

The generated pattern runtime provides the same marker constructor:

```ts
interface PatternHelpers {
  map: (value: any, fn: (value: any) => any) => any
  isCssUnit: (value: any) => boolean
  isCssVar: (value: any) => boolean
  isCssFunction: (value: any) => boolean
  fallback: typeof cssFallback
}
```

The first implementation accepts scalar `baseline` and `enhanced` props. Pairing two responsive pattern inputs requires
a multi-input conditional zipper; nesting `helpers.map` can produce mismatched condition trees. That helper should be
designed separately rather than placing responsive objects or arrays inside one fallback marker.

## Merge behavior

Fallback markers are atomic values:

```ts
css.raw({ width: css.fallback('100%', 'min(70rem, 100%)') }, { width: '50%' })
// width: "50%"
```

```ts
css.raw({ width: '50%' }, { width: css.fallback('100%', 'min(70rem, 100%)') })
// width: fallback("100%", "min(70rem, 100%)")
```

Deep-merge and object-walk helpers must stop at the marker. They must never merge its `values` array as a responsive
array or expose `__panda` and `values` as style keys.

## Type design

The generated system types add a branded value:

```ts
export interface CssFallbackValue<T> {
  readonly __panda: 'fallback'
  readonly values: readonly [T, T, ...T[]]
}

export interface CssFallbackFunction {
  <T>(first: T, second: T, ...rest: T[]): CssFallbackValue<T>
}
```

Fallback support belongs inside CSS property leaves:

```ts
type CssPropertyValue<T> = T | CssFallbackValue<T>

interface SystemProperties {
  width?: ConditionalValue<CssPropertyValue<WidthValue>>
  color?: ConditionalValue<CssPropertyValue<ColorValue>>
}
```

It must not be added directly to `ConditionalValue<T>`. That generic also types recipe selections and primitive pattern
properties where declaration fallbacks make no sense.

Apply `CssFallbackValue<T>` to:

- native CSS properties,
- data-backed utility properties that lower to CSS declarations,
- JSX style props derived from those properties,
- pattern properties declared as `type: 'property'`.

Do not apply it to:

- custom properties (`--*`) initially,
- recipe variant selections,
- token/enum/string/number/boolean pattern properties,
- HTML `style`,
- config fields that are not style values.

## Runtime and extraction marker

Generated codegen extends `CssFunction`:

```ts
interface CssFunction {
  (styles: Styles): string
  // existing overloads...

  raw: CssRawFunction
  fallback: CssFallbackFunction
}
```

The extractor recognizes:

```ts
css.fallback(a, b)
renamedCss.fallback(a, b)
namespace.css.fallback(a, b)
```

only when the `css` binding resolves to Panda's configured CSS import. It does not recognize shadowed objects,
destructured aliases, or arbitrary `.fallback()` methods.

The call must have at least two statically extractable scalar arguments. If any member is dynamic, the containing
property remains open and the outer style call is not partially rewritten.

No new `MatchCategory` is needed. `fallback` is an intrinsic member of the existing CSS binding, like `css.raw`.

## Core IR

Fallback must be distinct from responsive arrays and conditional alternatives:

```rust
pub enum StyleTree {
    // existing variants...
    Fallback(Vec<StyleTree>),
}

pub enum Literal {
    // existing variants...
    Fallback(Vec<Literal>),
}

pub enum AtomValue {
    // existing variants...
    Fallback(Box<[FallbackScalar]>),
}

pub enum FallbackScalar {
    String(Box<str>),
    Token { path: Box<str>, value: Box<str> },
    Number(Box<str>),
}
```

`FallbackScalar` prevents nested fallbacks, objects, arrays, booleans, null, and conditionals by construction.

`Literal::from_json` and `to_json` own marker decoding and encoding. Project, recipe, NAPI, and WASM paths should call
those shared conversions instead of growing independent marker parsers.

## Encoder and class identity

The encoder emits exactly one atom:

```text
width: fallback("75%", "min(60rem, 100%)")
  → Atom {
      prop: "width",
      value: Fallback(["75%", "min(60rem, 100%)"]),
      conditions: [],
    }
```

Atom equality and hashing include:

- a fallback domain tag,
- property,
- every typed member in authored order,
- conditions,
- shared importance.

Reversing members produces a different atom and class. Identical chains deduplicate.

Even with readable class names enabled, fallback payloads are always bounded by a hash:

```text
width_fallback_<hash>
```

The runtime and Rust use one canonical typed serialization contract plus Panda's existing hash. Parity tests cover
numbers, strings, tokens, Unicode, escapes, commas, CSS functions, and order reversal.

## Utility normalization

Each fallback member passes through the same normalization as an ordinary value:

```ts
css({
  color: css.fallback('blue.700', 'oklch(45% 0.16 250)'),
})
```

```css
color: var(--colors-blue-700);
color: oklch(45% 0.16 250);
```

The first release supports native properties, shorthands, token categories, arbitrary values, and data-backed
single-declaration utilities.

Callback-backed or multi-property transforms are deferred:

```ts
css({
  fancyUtility: css.fallback('legacy', 'enhanced'),
})
```

Applying the callback independently can produce different property sets or declaration orders. Supporting that requires
an ordered transform-result IR grouped by output property, not just `AtomValue::Fallback`. Panda reports
`css_fallback_transform_unsupported` instead of emitting partial CSS.

## Stylesheet declaration runs

Current `append_declaration` replaces an existing declaration with the same property. A fallback chain needs one
run-aware operation:

```rust
struct DeclarationRun {
    prop: String,
    values: Vec<String>,
    important: bool,
}
```

Appending a run follows these rules:

1. Compare importance against the existing run for the property.
2. If the existing run is important and the incoming run is not, keep the existing run.
3. Otherwise remove the entire existing run for that property.
4. Append every incoming declaration in authored order.

```text
existing width: 50%
incoming width: fallback(75%, min(...))
  → remove width: 50%
  → append width: 75%
  → append width: min(...)
```

Do not disable property deduplication globally. Ordinary style-object merging remains last-write-wins.

Grouped rule equality includes the complete ordered declaration vector, so rules only merge when their fallback runs are
identical. Current writer minification preserves declaration order and is safe once run-aware appending is in place.

Future CSS-aware optimizers must preserve fallback runs. Removing the baseline because the enhanced declaration appears
later can break unsupported targets.

## Recipes and slots

Config recipes and slot recipes already decompose through the atomic encoder. They should inherit fallback support
without a recipe-specific walker.

`RecipeStyleEntry.value` carries `AtomValue::Fallback`. Grouping keeps one fixed recipe class and writes the declaration
run under that class:

```css
@layer recipes {
  .button {
    color: #0057b8;
    color: oklch(55% 0.18 250);
  }
}
```

Base, variants, eager compounds, smart compounds, and slot entries all use the same representation.

## Transform behavior

A fully static call transforms normally:

```ts
css({
  width: css.fallback('75%', 'min(60rem, 100%)'),
})
```

```ts
'width_fallback_xxx'
```

The nested `css.fallback()` span is consumed by the rewritten outer `css()` call. Existing semantic import-liveness
logic removes the `css` import when no dynamic use remains.

A dynamic member keeps the outer call:

```ts
css({
  width: css.fallback('75%', enhancedWidth),
})
```

Panda does not emit only the baseline because that would make development and production behavior diverge.

Usage collection visits every member so token, keyframe, deprecation, and inspection data remain complete.

## Build info and hydration

Build info must retain one ordered atom. Extend `BuildValue`:

```json
{
  "p": 12,
  "v": {
    "f": [24, { "t": 7, "v": 25 }, { "n": 26 }]
  }
}
```

`f` contains the existing scalar value encodings:

- integer: interned string,
- `{ "t", "v" }`: token path and resolved value,
- `{ "n" }`: number.

Booleans, null, and nested `f` values are invalid.

This changes the wire shape, so `SCHEMA_VERSION` moves from `5` to `6`. Older consumers reject the artifact and use the
existing source re-extraction fallback. Hydration reconstructs one `AtomValue::Fallback` without flattening it.

Update the shared TypeScript `BuildAtom.v` union and every NAPI/WASM exhaustive conversion.

## Design systems

No new package export is needed. `css.fallback` ships as part of the existing design-system `css` artifact.

A library can publish:

```ts
import { css } from '@acme/ds/css'

export const card = css({
  color: css.fallback('#0057b8', 'oklch(55% 0.18 250)'),
})
```

The consumer hydrates one fallback atom and emits both declarations.

Compatibility has two gates:

1. Build-info schema `6` protects hydrated library atoms.
2. The design-system Panda peer range protects app code from re-exporting an older `css` runtime without `.fallback`.

Overlay codegen treats `css` as one unit. It must not combine a new `CssFunction` type with an old runtime
implementation.

## Diagnostics

Proposed diagnostics:

| Code                                 | Severity | Meaning                                                      |
| ------------------------------------ | -------- | ------------------------------------------------------------ |
| `css_fallback_arity_invalid`         | error    | fewer than two values                                        |
| `css_fallback_member_dynamic`        | warning  | a member cannot be extracted statically                      |
| `css_fallback_member_invalid`        | error    | member is object, array, boolean, null, or nested fallback   |
| `css_fallback_importance_mixed`      | error    | members do not share one importance                          |
| `css_fallback_custom_property`       | warning  | custom-property fallback would not provide reliable recovery |
| `css_fallback_transform_unsupported` | warning  | utility uses a callback or multi-property transform          |
| `css_fallback_marker_invalid`        | error    | serialized marker shape is malformed                         |

Diagnostics follow the existing `validation: none | warn | error` policy where applicable. Dynamic source values use a
warning and runtime bailout, matching other partially static extraction cases.

## Compiler flow

```text
css.fallback("75%", progression(3, 4))
  │
  ├─ source: binding-aware intrinsic
  ├─ config/pattern runtime: exact JSON-safe marker
  ▼
StyleTree::Fallback
  ▼
Literal::Fallback
  ▼
AtomValue::Fallback ── one ordered atom / one class
  ├─ build info schema 6 ── hydrate without flattening
  └─ stylesheet DeclarationRun
       ├─ width: 75%
       └─ width: --progression(3, 4)
```

## Implementation plan

### Phase 1: core representation and CSS output

1. Add `Fallback` to `StyleTree`, `Literal`, and `AtomValue`.
2. Add shared exact marker conversion to `Literal::from_json`/`to_json`.
3. Add scalar and shared-importance validation.
4. Encode one order-sensitive atom and bounded fallback class.
5. Add declaration-run append semantics.
6. Emit normal, condition-wrapped, recipe, grouped, minified, and split CSS.
7. Verify unchanged CSS snapshots when no fallback is used.

### Phase 2: generated and config APIs

1. Add `CssFallbackValue<T>` to CSS property leaves.
2. Add `css.fallback()` to generated codegen.
3. Make style walkers, responsive normalization, merge helpers, and `css.raw()` treat markers as leaves.
4. Add `cssFallback()` to `@pandacss/dev`.
5. Add binding-aware source extraction and transform support.
6. Add runtime/Rust hash parity tests.

### Phase 3: recipes and patterns

1. Cover `cva`, `sva`, config recipes, and config slot recipes.
2. Add fallback-aware `type: 'property'` pattern props.
3. Preserve markers through pattern defaults and transforms.
4. Add `PatternHelpers.fallback`.
5. Diagnose callback-backed multi-property utilities.
6. Cover eager compounds, smart compounds, and slot output.

### Phase 4: build info and design systems

1. Add `{ "f": [...] }` to `BuildValue`.
2. Bump build-info schema to `6`.
3. Update compiler-shared, NAPI, and WASM mirrors.
4. Test publish, source fallback, hydrate, module tree-shaking, and overlay codegen.
5. Enforce compatible styled-system runtime through the Panda peer range.

## Test matrix

### API and types

- two and three members,
- property-specific value errors,
- native properties and data-backed utilities,
- JSX style props,
- rejection for custom properties and HTML `style`,
- rejection in primitive pattern props.

### Extraction

- direct, aliased, and namespace CSS imports,
- shadowed and arbitrary `.fallback()` calls,
- malformed marker objects,
- nested fallback rejection,
- dynamic-member bailout,
- token calls and CSS custom function calls as static members.

### Responsive and merge

- fallback markers inside responsive arrays,
- arrays inside markers rejected,
- conditions and nested selectors,
- marker survives `css.raw`,
- scalar replaces prior marker,
- marker replaces prior scalar,
- marker remains atomic through pattern helpers.

### Encoder and transform

- one atom and one class,
- order-sensitive identity,
- identical-list deduplication,
- shared and mixed `!important`,
- numbers, strings, tokens, Unicode, and escapes,
- runtime/Rust class parity,
- static rewrite and dead-import cleanup.

### Recipes and patterns

- `cva`/`sva` base, variant, and compound styles,
- config recipe and slot recipe output,
- pattern property input,
- `PatternHelpers.fallback` output,
- one marker per responsive pattern condition,
- paired responsive transform inputs deferred,
- callback-transform diagnostic.

### Stylesheet

- exact duplicate declarations,
- replacement of an existing declaration run,
- normal vs important run precedence,
- media/supports/selector wrappers,
- recipe grouping and grouped-rule merge,
- minified and split output,
- layer polyfill,
- future optimizer regression fixture.

### Build info and design systems

- schema `5` rejection and source fallback,
- schema `6` round trip,
- scalar/token/number members,
- recipe and slot entry hydration,
- per-member token retention,
- module tree-shaking,
- design-system publish/consume,
- virtualized CSS runtime compatibility.

## Decisions

| Topic                       | Decision                                                 |
| --------------------------- | -------------------------------------------------------- |
| Application API             | `css.fallback(first, second, ...rest)`                   |
| Config recipe API           | `cssFallback()` from `@pandacss/dev`                     |
| Pattern construction        | `PatternHelpers.fallback`                                |
| Runtime representation      | Exact JSON-safe `{ __panda: "fallback", values }` marker |
| Core representation         | One ordered fallback value, atom, and class              |
| Responsive arrays           | Unchanged; a marker is a responsive leaf                 |
| Class identity              | Full ordered typed list; bounded by a fallback hash      |
| Importance                  | One shared value across every member                     |
| Custom properties           | Rejected initially                                       |
| Callback utility transforms | Rejected initially                                       |
| Build info                  | New fallback value and schema `6`                        |
| CSS emission                | Property-scoped ordered declaration runs                 |
| Design-system export        | Existing `css` unit; no new subpath                      |
| Minification                | Duplicate declaration order is a snapshot contract       |

## Unresolved questions

1. Should the public config helper also be named `fallback`, or is `cssFallback` worth the clarity and collision
   avoidance?
2. Should multiple token categories in one chain preserve token identity in the public inspection output, not only build
   info and pruning?
3. Should a future version support custom utilities whose callback returns the same property set for every member?
4. Should pattern helpers gain a general multi-input conditional zipper before documenting responsive fallback
   construction?
5. Should the future CSS optimizer receive explicit protected-run metadata, or infer fallback runs from adjacent
   duplicate properties?

## Related

- [Atomic encoding](./atomic-encoding.md)
- [StyleTree](./style-tree.md)
- [Build info](./build-info.md)
- [Native stylesheet compiler](./stylesheet.md)
- [CSS custom functions](./css-custom-functions.md)
- [Virtual styled-system](./virtual-styled-system.md)
