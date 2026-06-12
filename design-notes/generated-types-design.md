---
title: Generated Types Design
status: draft
scope:
  - crates/pandacss_codegen
  - crates/pandacss_config
---

# Generated Types Design

## Goal

Generated types are a core Panda feature. The Rust codegen path must preserve autocomplete and type safety while reducing
the editor and TypeScript compiler cost of the legacy generated type graph.

This is not an optional mode. We should build one best implementation and keep the existing user-facing strictness
options:

- `strictTokens`
- `strictPropertyValues`
- `jsxStyleProps`

The goal is to improve the generated type structure, not add a second type system.

The resolved metadata flow is covered in [Domain Type Data Design](./domain-type-data-design.md). The short version:
domain objects such as token dictionaries, utilities, conditions, patterns, and recipes expose `type_data()` methods;
`pandacss_codegen` consumes that data and emits files.

## Legacy Problem

The legacy generator produces useful autocomplete, but it often repeats large unions and composes them through recursive
generic helpers. The expensive pieces are:

- `UtilityValues`: large per-property unions that repeat token categories, fractions, CSS fallbacks, and custom values,
- `SystemProperties`: every CSS property plus every Panda utility and shorthand,
- `Tokens`: eager category unions and a global template-literal `Token` union,
- `ConditionalValue`: recursive responsive/condition values,
- `Nested`: recursive selector/condition nesting over a large property intersection,
- JSX style props attached to every intrinsic/component prop type when `jsxStyleProps: "all"`.

Autocomplete is not the problem. The problem is how much type expansion is required to provide it.

## Design Principles

- Preserve direct style-property autocomplete.
- Preserve token autocomplete.
- Preserve recursive CSS nesting indefinitely.
- Preserve `strictTokens` and `strictPropertyValues` semantics.
- Preserve `jsxStyleProps` as the main JSX editor-cost control.
- Avoid repeating long inline unions across many properties.
- Prefer named aliases at recursive boundaries.
- Prefer `interface extends` for object composition on hot public object types.
- Avoid distributive helpers on large style objects unless they are measured and necessary.
- Split generated type files by responsibility so imports touch smaller surfaces.
- Do not touch legacy `packages/types`; Rust codegen owns the new generated type artifacts.

## File Layout

The generated type artifacts:

```txt
types/index
types/tokens
types/system     # condition/value aliases + own csstype + SystemProperties + selectors + SystemStyleObject + globals/keyframes/fontface
types/pattern
types/recipe
```

`types/system` is the **merged** core surface — what were once `conditions`, `values`, `csstype`,
`selectors`, `properties`, and `system-types` are one file. Fewer modules means fewer cross-module
boundaries on the hot path (the recursive `SystemStyleObject` no longer reaches across support files),
which matters at enterprise scale. `types/index` re-exports the public surface. Artifact dependencies
stay granular:

| Artifact           | Depends on                                                       |
| ------------------ | ---------------------------------------------------------------- |
| `types/tokens`     | `CodegenFormat`, `Tokens`, `Themes`                              |
| `types/system`     | `CodegenFormat`, `Conditions`, `Tokens`, `Utilities`, `Syntax`   |
| `types/pattern`    | `CodegenFormat`, `Patterns`, `Utilities`, `Tokens`               |
| `types/recipe`     | `CodegenFormat`, `Recipes`, `Conditions`                         |

This lets watch mode regenerate only the files whose type inputs changed. (Earlier drafts split
`system` into five files by role; the measured win from one fast graph outweighed the
finer-grained invalidation.)

## Recursive CSS Shape

CSS nesting can be arbitrarily deep, so the type system must remain recursive. The important change is that recursion
should point at stable named aliases instead of repeatedly expanding a large generic intersection.

Preferred shape:

```ts
export interface SystemStyleObject
  extends SystemProperties,
    CssVarProperties,
    NestedSelectors,
    NestedConditions,
    NestedArbitrary {}
```

Nested pieces recurse back to the named alias:

```ts
export type NestedSelectors = {
  [K in Selector]?: SystemStyleObject
}

export type NestedConditions = {
  [K in Condition]?: SystemStyleObject
}

export type NestedArbitrary = {
  [K in `&${string}` | `@${string}`]?: SystemStyleObject
}
```

This preserves indefinite nesting:

```ts
css({
  color: "red.500",
  _hover: {
    "& svg": {
      md: {
        color: "blue.500",
      },
    },
  },
})
```

The recursion is still there, but TypeScript can name the recursive boundary instead of re-instantiating
`Nested<(SystemProperties | GenericProperties) & CssVarProperties>` at every level.

Use `interface extends` for this object composition instead of a large intersection alias. TypeScript can cache
relationships between interfaces more effectively, and intersections require checking every constituent before the
effective flattened type.

For the same reason, keep recursive maps as named aliases or interfaces:

```ts
export interface NestedSelectors {
  [selector: Selector]: SystemStyleObject | undefined
}
```

The exact index shape can change based on selector support, but the recursion should always point back to
`SystemStyleObject` by name.

## Value Aliases

The generator should canonicalize repeated value unions into aliases inside `types/system`.

Instead of emitting this shape repeatedly:

```ts
gap?: ConditionalValue<Tokens["spacing"] | CssVars | AnyString>
padding?: ConditionalValue<Tokens["spacing"] | CssVars | AnyString>
margin?: ConditionalValue<"auto" | Tokens["spacing"] | CssVars | AnyString>
```

emit:

```ts
export type SpacingValue = Tokens["spacing"] | CssVars | AnyString
export type MarginValue = "auto" | SpacingValue

export interface SystemProperties {
  gap?: ConditionalValue<SpacingValue>
  padding?: ConditionalValue<SpacingValue>
  margin?: ConditionalValue<MarginValue>
}
```

This preserves autocomplete but reduces repeated union expansion.

Common aliases should include:

- `StringValue`
- `NumberValue`
- `CssVarValue`
- `ColorValue`
- `SpacingValue`
- `SizeValue`
- `RadiusValue`
- `BorderValue`
- `ShadowValue`
- `DurationValue`
- `EasingValue`
- `AnimationValue`
- `FractionValue`
- property-family aliases such as `MarginValue`, `InsetValue`, and `TranslateValue`

The aliases are generated from the resolved utility metadata, not hard-coded lists only. Hard-coded aliases are useful
only when the same semantic union appears across many utilities.

No property declaration should contain an anonymous complex union if that union appears more than once. Alias generation
is a TypeScript performance strategy, not just a readability improvement: named types let the compiler cache and display
the type without re-running the same union normalization at each property site.

Use direct property declarations:

```ts
export interface SystemProperties {
  color?: ConditionalValue<ColorValue>
  backgroundColor?: ConditionalValue<ColorValue>
}
```

Avoid generated declarations like:

```ts
export interface SystemProperties {
  color?: ConditionalValue<Tokens["colors"] | CssVars | CssProperties["color"] | AnyString>
  backgroundColor?: ConditionalValue<Tokens["colors"] | CssVars | CssProperties["backgroundColor"] | AnyString>
}
```

## Strictness

`strictTokens` and `strictPropertyValues` should transform generated value aliases and property wrappers, not fork the
entire type graph.

When `strictTokens` is false, token-backed values keep autocomplete and allow CSS fallback/freeform values:

```ts
export type ColorValue = Tokens["colors"] | CssVars | CssProperties["color"] | AnyString
```

When `strictTokens` is true, the same alias becomes stricter but still supports documented escape hatches:

```ts
export type ColorValue = WithEscapeHatch<Tokens["colors"] | CssVars>
```

When `strictPropertyValues` is true, known keyword properties use `OnlyKnown`:

```ts
display?: ConditionalValue<WithEscapeHatch<OnlyKnown<"display", CssProperties["display"]>>>
```

When it is false:

```ts
display?: ConditionalValue<CssProperties["display"] | AnyString>
```

The important part is that strictness changes the value expression, not the public file layout or the recursive object
model.

## CSS Property Types (our own csstype)

Panda owns its CSS-property type model — no vendored npm `csstype`. The whole native-property surface
collapses to **one shared value type**:

```ts
export type Globals = "inherit" | "initial" | "revert" | "revert-layer" | "unset"
export type CssValue = Globals | (string & {}) | number

export interface CssProperties {
  accentColor?: ConditionalValue<CssValue>   // ~540 native props, all share CssValue
  // …
}
export interface SystemProperties extends CssProperties {
  color?: ConditionalValue<ColorsValue>       // configured utilities override with their alias
  // …
}
```

Why this shape:

- **Completeness via `interface extends`.** `SystemProperties extends CssProperties` accepts *any*
  CSS property (native props fall back to `CssValue`), while configured utilities override the
  inherited member with their precise token alias. The alias is assignable to `CssValue`, so the
  override is valid. No `Omit` / `Exclude` / intersection — a clean interface combine.
- **One cached type for every native prop.** All ~540 native members are `ConditionalValue<CssValue>`,
  so TypeScript instantiates that **once** and reuses it. Measured: the whole graph resolves at ~20
  instantiations vs legacy's ~2,600 (see Benchmarks).
- **Global keywords for free.** `Globals` in `CssValue` gives `inherit`/`unset`/… autocomplete on
  every property at no per-property cost.
- **Deliberate tradeoff:** native (non-utility) props do **not** get per-keyword autocomplete
  (`display: 'flex'` suggestions). Configured utilities still get full token + literal autocomplete
  (the base preset configures the keyword-bearing properties), and any string is still accepted via
  `(string & {})`. We chose this — a vendored per-property keyword csstype is the single heaviest input
  to the legacy type cost, and it ships in the `compiler-wasm` browser binary.

### Property registry (shared, single source of truth)

The list of valid property names lives in **`pandacss_shared::css_properties::CSS_PROPERTY_NAMES`** —
one flat, sorted, `@generated` list (mdn-data + Panda SVG additions; `-webkit-` + SVG kept, `-moz-`/
`-ms-` dropped). Regenerate with `pnpm --filter @pandacss/is-valid-prop mdn:rust`.

Both consumers read the **same** list, so "a valid property to extract" and "a property offered in the
types" can never diverge:

- the **extractor** `binary_search`es it for `is_css_property` (a hot path),
- the **codegen** emits one `CssProperties` member per name.

Selectors are generated locally (`Selector = `&${string}` | `@${string}``); we do not carry csstype's
`Pseudos`.

## Token Types

Token autocomplete should stay category-based:

```ts
export interface Tokens {
  colors: ColorToken
  spacing: SpacingToken
  sizes: SizeToken
}
```

Avoid using a global `Token` template-literal union as a dependency of most style properties. It is useful for token
functions and CSS variable values, but it should not be threaded through every property when a category-specific alias is
available.

Preferred:

```ts
color?: ConditionalValue<ColorValue>
gap?: ConditionalValue<SpacingValue>
```

Avoid:

```ts
type CssVarValue = ConditionalValue<Token | CssVars | AnyString | (number & {})>
```

except in APIs that genuinely accept any token path.

Generated lookup maps are preferred over type-level derivation when the generator already knows the relationship:

```ts
export interface TokenCategories {
  colors: ColorToken
  spacing: SpacingToken
}

export interface UtilityValueMap {
  color: ColorValue
  gap: SpacingValue
}
```

Consumers can index into these maps instead of deriving the same relationship with conditional and mapped types.

## Pattern Properties

Pattern props must not use `any`. They should use the same property and value aliases as the rest of the type system.

Mapping:

| Pattern property config | Generated type                                      |
| ----------------------- | --------------------------------------------------- |
| `type: "enum"`          | `ConditionalValue<"a" | "b">`                      |
| `type: "token"`         | `ConditionalValue<TokenValue<"category">>`          |
| `type: "token" + property` | `ConditionalValue<TokenValue<"category"> | SystemProperties["property"]>` |
| `type: "property"`      | `SystemProperties["property"]`                      |
| `type: "string"`        | `ConditionalValue<string>`                          |
| `type: "number"`        | `ConditionalValue<number>`                          |
| `type: "boolean"`       | `ConditionalValue<boolean>`                         |
| unknown                 | `ConditionalValue<unknown>`                         |

Example:

```ts
export interface StackProperties {
  align?: SystemProperties["alignItems"]
  justify?: SystemProperties["justifyContent"]
  direction?: SystemProperties["flexDirection"]
  gap?: SystemProperties["gap"]
}
```

For non-strict patterns:

```ts
interface StackStyles
  extends StackProperties,
    DistributiveOmit<SystemStyleObject, keyof StackProperties> {}
```

This shape needs measurement. `DistributiveOmit` over a recursive style object can be expensive when generated for every
pattern. If a non-distributive `Omit<SystemStyleObject, keyof StackProperties>` preserves the behavior we need, prefer
that. If omitting is only needed to avoid duplicate property display, consider a named per-pattern style interface:

```ts
interface StackRestStyles extends Omit<SystemStyleObject, keyof StackProperties> {}
interface StackStyles extends StackProperties, StackRestStyles {}
```

The rule is: do not repeatedly apply distributive helpers to `SystemStyleObject` without benchmark evidence.

For strict patterns:

```ts
interface StackStyles extends StackProperties {}
```

## Public API Boundaries

Large inferred types should be collapsed at generated module boundaries. Public declarations should use explicit return
types and exported named interfaces instead of asking TypeScript to infer through helper implementation details.

Prefer:

```ts
export interface CssFn {
  (styles?: SystemStyleObject): string
  raw(styles?: SystemStyleObject): SystemStyleObject
}

export declare const css: CssFn
```

Avoid deriving public signatures from a deeply generic helper chain.

This mirrors the strategy used by type-heavy libraries: generated declarations should present a compact, named surface
even when the runtime implementation is generic.

When generated TS source has runtime values that naturally carry useful type information, consider type queries at the
boundary instead of expanding a complex direct type. For example, a generated constant map can become the source of a
type with `typeof` when that is cheaper than repeating the object shape. Use this only where it measurably improves
instantiation counts and does not weaken autocomplete.

## JSX Style Props

`jsxStyleProps` remains the main user-facing performance control for JSX surfaces:

```ts
jsxStyleProps: "all" | "minimal" | "none"
```

This should not affect `css({ ... })` autocomplete. It only controls whether style props are attached directly to JSX
component prop types.

- `all`: JSX components accept all style props directly.
- `minimal`: JSX components accept `css` but not all individual style props.
- `none`: generated JSX helpers do not expose style props.

The generated type files can still include `SystemProperties`; JSX artifacts decide how much of that surface they import
and expose.

Generated JSX component prop types should avoid recomputing HTML props plus style props through large intersections per
component. Prefer shared interfaces for the common composition and narrow component-specific aliases:

```ts
export interface PandaStyleProps extends SystemProperties {
  css?: SystemStyleObject
}

export interface HTMLPandaProps<T> extends HTMLProps<T>, PandaStyleProps {}
```

If a framework requires a more complex polymorphic `as`/`component` type, keep it behind a named helper and avoid
inlining it into every generated component declaration.

## TypeScript Performance Rules

The generated type system should follow these rules:

- Prefer `interface extends` over large object intersection aliases for public object shapes.
- Name complex unions, conditional types, recursive maps, and mapped types.
- Prefer base interfaces and lookup maps over exhaustive unions in hot APIs.
- Avoid distributing over `SystemStyleObject` or token unions unless there is no simpler representation.
- Avoid chained type transforms such as `Omit<Pick<...>>` on large recursive objects.
- Export explicit function and constant types; do not rely on declaration emit to infer large public types.
- Keep global module declarations small and import named types instead of embedding computed shapes.
- Use `jsxStyleProps` to control how much of `SystemProperties` is attached to JSX prop types.
- Keep `skipLibCheck` compatibility, but do not depend on it to hide broken generated declarations.

## Benchmarks

Type performance must be measured as part of implementing the Rust-generated type artifacts.

Use TypeScript diagnostics on generated fixtures:

```sh
tsc -p ./fixtures/generated-types/tsconfig.json --extendedDiagnostics
```

Track at least:

- `Files`
- `Lines of Definitions`
- `Types`
- `Instantiations`
- `Memory used`
- total check time

Required fixture sizes:

- small theme: a few token categories and one pattern,
- medium theme: representative Panda preset with patterns and recipes,
- large theme: many token categories, semantic tokens, recipes, and JSX enabled,
- strict theme: `strictTokens: true` and `strictPropertyValues: true`,
- JSX surfaces: `jsxStyleProps: "all"`, `"minimal"`, and `"none"`.

The comparison target is the legacy generated type shape. The Rust output should preserve autocomplete while reducing
instantiations and memory in the medium and large fixtures.

### Harness

`pnpm bench:types` runs the harness:

- Fixtures live in `fixtures/generated-types/configs/*.json` (`small`, `medium`, `large`, `strict`, `jsx-{all,minimal,none}`),
  shared verbatim by both paths so the comparison is apples-to-apples.
- `bench/src/bin/generated_types_perf.rs` emits the Rust-codegen styled-system per fixture; `bench/src/generated-types-perf.ts`
  emits the legacy v1 styled-system via `@pandacss/node` (with `eject: true`, so no base preset is mixed in), drops an
  identical `usage.ts` importing only `./styled-system/types`, and runs `tsc --extendedDiagnostics` on each.
- Output is written under `fixtures/generated-types/out/` (gitignored, reproducible).

The usage exercises the **type graph** (`SystemStyleObject` recursion, tokens, conditions, nesting) — not the WIP runtime
helpers (`cva`/`sva`/recipe runtimes), which still have type errors and are out of scope for type-cost measurement.

Current readings (both sides emitted as `.d.ts`, `skipLibCheck` on — the real-world scenario): Rust wins **every** metric
across all fixtures — instantiations **−99%** (~20 vs legacy's ~2,600), `Types` **−82 to −92%**, memory **−21 to −25%**,
check time **−40 to −67%**. The headline is instantiations: every native CSS property shares one cached
`ConditionalValue<CssValue>`, and `skipLibCheck` skips the declaration bodies, so only the user's own `css({…})` shape
drives instantiation. Memory dropped further once the vendored csstype's `Property` namespace was removed entirely.

Measurement only holds for `.d.ts` under `skipLibCheck` (how Panda ships). An early cut emitted the Rust side as `.ts`
*source*, which defeated skipLibCheck on that side and made the (then-vendored) csstype look like a 2–3× `Types`
regression — a measurement artifact that vanished once the own `CssValue`-based csstype replaced the vendored keyword
unions. Caveat: the 2026-06-01 `jsx-{all,minimal,none}` fixtures read identically because `usage.ts` imports only
`./styled-system/types`, not the generated JSX runtime — so per-mode `jsxStyleProps` editor cost is not captured in that
harness (re-run with a JSX usage fixture for mode-specific numbers).

## Implementation Order

Steps 1–6 below are implemented in `pandacss_codegen` (`types/*`, pattern/recipe type modules, snapshots, strict
fixtures). Steps 7–8 remain ongoing (editor-cost regression harnesses and full `jsxStyleProps` mode coverage in type
benchmarks).

1. Add type artifact IDs and dependency metadata.
2. Generate `types/tokens` from resolved token categories.
3. Generate `types/system`: condition/value aliases, own csstype (`CssValue` + `CssProperties` from the shared property
   registry), `SystemProperties extends CssProperties` with per-utility overrides, selectors, and the named recursive
   `SystemStyleObject` — all in one file.
4. Update pattern codegen to import and use precise pattern property types.
5. Add snapshots for TS and JS/DTS outputs that show typed pattern props.
6. Add strict typecheck fixtures for representative generated TS.
7. Add editor-cost checks where possible, such as comparing generated type file size and TypeScript diagnostics timing
    against the legacy shape.
8. Add regression fixtures for `strictTokens`, `strictPropertyValues`, and each `jsxStyleProps` setting.

## Non-Goals

- No `typeOptimization` config option.
- No loss of direct style-property autocomplete.
- No shallow CSS object type.
- No dependency on legacy `packages/types` as source of truth.
- No 1:1 port of the old generated type graph.
