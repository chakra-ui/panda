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

The generated type artifacts should be split by role:

```txt
types/index
types/conditions
types/selectors
types/tokens
types/values
types/properties
types/system-types
types/pattern
types/recipe
```

`types/index` should re-export the public surface. Artifact dependencies should stay granular:

| Artifact             | Depends on                                      |
| -------------------- | ----------------------------------------------- |
| `types/conditions`   | `CodegenFormat`, `Conditions`                   |
| `types/selectors`    | `CodegenFormat`                                 |
| `types/tokens`       | `CodegenFormat`, `Tokens`, `Themes`             |
| `types/values`       | `CodegenFormat`, `Tokens`, `Utilities`          |
| `types/properties`   | `CodegenFormat`, `Tokens`, `Utilities`, `Syntax` |
| `types/system-types` | `CodegenFormat`, `Conditions`, `Utilities`      |
| `types/pattern`      | `CodegenFormat`, `Patterns`, `Utilities`, `Tokens` |
| `types/recipe`       | `CodegenFormat`, `Recipes`, `Conditions`        |

This lets watch mode regenerate only the files whose type inputs changed.

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

The generator should canonicalize repeated value unions into aliases.

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

## Implementation Order

1. Add type artifact IDs and dependency metadata.
2. Generate `types/conditions` and `types/selectors`.
3. Generate `types/tokens` from resolved token categories.
4. Generate `types/values` with category and shared value aliases.
5. Generate `types/properties` using aliases instead of repeated inline unions.
6. Generate `types/system-types` with named recursive nesting aliases.
7. Update pattern codegen to import and use precise pattern property types.
8. Add snapshots for TS and JS/DTS outputs that show typed pattern props.
9. Add strict typecheck fixtures for representative generated TS.
10. Add editor-cost checks where possible, such as comparing generated type file size and TypeScript diagnostics timing
    against the legacy shape.
11. Add regression fixtures for `strictTokens`, `strictPropertyValues`, and each `jsxStyleProps` setting.

## Non-Goals

- No `typeOptimization` config option.
- No loss of direct style-property autocomplete.
- No shallow CSS object type.
- No dependency on legacy `packages/types` as source of truth.
- No 1:1 port of the old generated type graph.
