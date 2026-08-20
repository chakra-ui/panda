---
title: Ordered CSS value fallbacks (`fallback()`)
status: implemented
scope:
  - crates/pandacss_shared
  - crates/pandacss_stylesheet
  - crates/pandacss_codegen
  - packages/types
related:
  - atomic-encoding.md
  - stylesheet.md
  - style-tree.md
  - css-custom-functions.md
---

# Ordered CSS value fallbacks (`fallback()`)

## Summary

Panda emits an ordered run of declarations for one property when the value is written in the `fallback()` form:

```ts
css({
  width: 'fallback(min(60rem, 100%), 75%)',
})
```

```css
.width_fallback\(min\(60rem\,_100\%\)\,_75\%\) {
  width: 75%;
  width: min(60rem, 100%);
}
```

Members are written most-preferred first, the same shape as `var(--brand, red)`. Panda emits them in reverse, because
CSS keeps the last declaration it understands.

This is the progressive-enhancement primitive CSS already has and Panda could not express. It pairs a newer value with a
widely supported one:

```ts
css({
  color: 'fallback(oklch(55% 0.18 250), #0057b8)',
  paddingInline: 'fallback(clamp(1rem, 4vw, 3rem), 1rem)',
})
```

The value form, `css.fallback()`, extraction, transform, diagnostics, and CSS emission across atomic, condition-wrapped,
recipe, slot, grouped, and minified output are all implemented.

## The value is a string, and that is the whole design

An earlier draft of this note proposed a marker object, `{ __panda: 'fallback', values: [...] }`, carried by new
`Fallback` variants on `StyleTree`, `Literal`, and `AtomValue`, plus a `FallbackScalar` type, a build-info wire change,
and a `SCHEMA_VERSION` bump from 5 to 6.

None of that shipped, because none of it was needed. A fallback run is one value for one property. Writing it as one
string says exactly that, and every stage Panda already has treats a string correctly without being taught anything:

| Stage        | What it needed for the string form             |
| ------------ | ---------------------------------------------- |
| Extraction   | nothing, it is a string literal                |
| `StyleTree`  | nothing                                        |
| `Literal`    | nothing                                        |
| Encoder      | nothing, one atom with one value               |
| Build info   | nothing, no schema bump                        |
| Class naming | nothing, the existing arbitrary-value escaping |
| Runtime      | nothing, no serialization contract to keep     |
| Stylesheet   | expansion into a declaration run               |

The whole feature is one new module in `pandacss_shared` and one branch in the stylesheet emitter: 233 changed lines
across 4 files, plus 105 lines of parser.

Three consequences are worth stating outright, because they were open problems in the marker design:

**Token references keep working.** `collect_token_refs` scans raw value strings for `{colors.brand}` and `token(...)`,
so a token inside a run is discovered for pruning exactly like a token inside `linear-gradient(...)`. The marker design
needed per-member token identity plumbed through build info to get the same result.

**There is no runtime parity contract.** Class names come from the value text through the same escaping every arbitrary
value uses. Nothing in the generated runtime has to reproduce a canonical serialization byte for byte, so nothing can
drift.

**Design systems need no compatibility gate.** A published library's build info carries a string, which every consumer
version already understands. The marker design needed schema 6 plus a peer-range check on the styled-system runtime.

## Why not a responsive array

Arrays already mean responsive values, and that meaning cannot change:

```ts
css({ width: ['100%', '50%'] }) // base, then the first breakpoint
```

A fallback marker sits inside a responsive array as a leaf, one run per breakpoint:

```ts
css({ width: ['fallback(min(60rem, 100%), 100%)', 'fallback(min(70rem, 75%), 75%)'] })
```

Multiple ordinary atoms cannot express a run either. Atoms live in hash sets and sort independently, and class attribute
order does not decide which declaration wins in the stylesheet. The run has to stay one value all the way to emission.

## What CSS fallbacks do and do not recover

A fallback works when the browser rejects the later declaration at parse time:

```css
.card {
  color: #0057b8;
  color: oklch(55% 0.18 250);
}
```

It does not recover from failures at computed-value time:

```css
.card {
  color: red;
  color: var(--possibly-invalid);
}
```

If the second declaration becomes invalid after substitution, the browser applies the property's invalid-value behavior
rather than restarting the cascade at `red`. `fallback()` preserves CSS semantics. It is not a `try`/`catch`.

Custom-property declarations are excluded for the same reason. `--accent` accepts an arbitrary token stream, so an older
browser keeps the second declaration and only discovers the unsupported value when `var(--accent)` is substituted, too
late to recover the first.

## The value form

```text
fallback(<value>, <value> [, <value>]...)
```

Parsed by `pandacss_shared::css_fallback`. Five rules define it.

**Members are written most-preferred first.** `fallback(min(60rem, 100%), 75%)` means "use `min()`, fall back to 75%",
the same shape as `var(--brand, red)`. CSS takes the last declaration it understands, so the emitter writes the members
in reverse. Source order is intent; output order is cascade.

**Two members minimum.** One value has no baseline to fall back to.

**Commas split only at the top level.** Nesting in parens, brackets, and quotes belongs to the member, so
`fallback(min(60rem, 100%), 75%)` is two members and `fallback(var(--brand, blue), red)` is two members.

**Runs do not compose.** `fallback(fallback(a, b), c)` is rejected. One property's members are already ordered, so
nesting adds nothing, and expanding only the outer level would emit a declaration whose value is a function no browser
implements.

**The form means a run or nothing.** A value written as `fallback(...)` that does not parse as one emits no CSS for that
property, rather than passing its text through. `fallback(red)`, `fallback(red, blue`, and a nested run all emit
nothing. Sibling properties in the same rule are unaffected.

That last rule is the one deliberate break from how Panda treats unknown values everywhere else, where the text passes
through untouched. It exists because `fallback()` is not real CSS: passing it through guarantees a broken declaration,
while passing through an unknown real function might still be valid in some browser. Every such drop is
[reported](#diagnostics).

## Emission

`Emitter::fallback_declarations` lowers each member through the same utility transform an ordinary value would, so
tokens, shorthands, arbitrary values, and default units behave identically per member:

```ts
css({ bg: 'fallback(oklch(55% 0.18 250), brand)' })
```

```css
.bg_fallback\(oklch\(55\%_0\.18_250\)\,_brand\) {
  background-color: var(--colors-brand);
  background-color: oklch(55% 0.18 250);
}
```

It returns `None`, emitting nothing, when the run is not provably one ordered cascade: a member lowering to a nested
object, or members disagreeing on which properties they produce, which a multi-property utility transform can do.

Two call sites share it. `collect_atom_rules` handles atomic CSS and keeps the class name the whole value already earns.
`property_declarations` handles everything else, which is why recipes, slot recipes, variants, and global CSS work
without a fallback-specific walker.

### Class naming

A run is named like any other arbitrary value, escaped, not hashed:

```css
.c_fallback\(blue\,_red\)
.c_color-mix\(in_oklch\,_red\,_blue\)   /* already how Panda names this */
```

Order-sensitivity and deduplication both fall out of the text. `fallback(red, blue)` and `fallback(blue, red)` are
different strings, so different classes, so different cascades. Identical runs are the same string, so one class.

Hashing was considered and rejected. It would make `fallback()` the only value form with a bespoke naming rule, it would
create a runtime parity contract where none is needed, and it would produce class names that say nothing when readable
class names are the entire point of the default. Users who want short names set `hashClassNames: true`, which already
hashes everything uniformly.

### Declaration runs

`append_declaration` used to replace an existing same-property declaration in place. It is now a one-member case of
`append_declaration_run`, which appends an ordered run as a unit:

1. No existing declaration for the property, append the run.
2. Existing declaration is important and the incoming run is not, keep the existing one.
3. Otherwise remove every existing declaration for that property and insert the run where the first one was.

Inserting at the original position, not at the end, is what keeps declaration order stable for every non-fallback rule.
Property deduplication stays on globally; ordinary style-object merging is still last-write-wins.

```text
existing   width: 50%
incoming   width: fallback(min(60rem, 100%), 75%)
result     width: 75%
           width: min(60rem, 100%)
```

Grouped rule equality compares the full ordered declaration vector, so rules only merge when their runs match. The
minifier preserves declaration order.

A future CSS-aware optimizer must not drop the baseline because a later declaration sets the same property. That is the
one thing about this feature an optimizer can silently break.

## Non-goals

- Recovering from invalid-at-computed-value-time behavior.
- Custom-property declarations.
- Falling back between different properties, such as `display` and `-webkit-box`.
- Polyfilling unsupported values.
- Dynamic, conditional, responsive, object, boolean, or null members.
- Callback-backed multi-property utility transforms.
- Replacing `@supports` where feature detection is the clearer tool.

## The `css.fallback()` API

The string form needs no API. `css.fallback()` adds type safety and discoverability:

```ts
css({
  width: css.fallback('min(60rem, 100%)', '75%'),
})
```

The runtime is one line — it returns the string, joining with `FALLBACK_SEPARATOR`:

```ts
fallback: function cssFallback(...values) {
  return `fallback(${values.join(', ')})`
}
```

`Resolver::resolve_fallback_call` folds the same call at build time, so the class name is identical either way. A
sandbox test asserts that directly, which is the only parity check the feature needs.

Only Panda's own `css` binding folds. Renamed imports (`css as panda`) and namespace imports (`p.css.fallback`) both
resolve; a local object that happens to be called `css`, and `cva.fallback(...)`, do not. `fallback` lives on the `css`
export alone, so being in the css category is not enough.

A dynamic member leaves the whole property open rather than emitting only the baseline, which would make dev and
production diverge.

### Members are typed by the property they sit in

Two overloads, and the order matters:

```ts
type CssFallbackMember = string | number

interface CssFallbackFunction {
  // Uniform members: `T` comes from the property, so its values autocomplete.
  <T>(first: T, second: T, ...rest: T[]): T
  // Members of differing types: each position is inferred on its own.
  <A extends CssFallbackMember, B extends CssFallbackMember, R extends CssFallbackMember[]>(
    first: A,
    second: B,
    ...rest: R
  ): A | B | R[number]
}
```

The first overload is what makes the editor useful. `T` has no argument to infer from before you type one, so it comes
from the contextual return type — the property — and every parameter is typed as that property's value union. Inside
`css.fallback(` you get the same 33 color tokens you get on `color:` itself.

The second catches members that do not share a type, where the first fails. It returns the union of what you passed, so
members are checked by ordinary assignability rather than by inference:

```ts
css({ color: css.fallback('blue.300', 'red.200') }) // ok under strictTokens
css({ color: css.fallback('blue.300', 'notAToken') }) // error: not a color token
css({ padding: css.fallback('[1rem]', '4') }) // the escape hatch still applies per member
css({ padding: css.fallback('1rem', 4) }) // differing types, second overload
css({ color: 'fallback(blue.300, red.200)' }) // error: a plain string is not a token
```

That last line needs no help: a bare string was never a valid token, so `strictTokens` rejects it on its own.

Naming the first two parameters is what enforces arity — a bare rest parameter would accept a single value.

The second overload is
[StyleX's `firstThatWorks` signature](https://github.com/facebook/stylex/blob/main/packages/@stylexjs/babel-plugin/src/shared/stylex-first-that-works.js).
Two earlier attempts each lost something measurable: a phantom-branded `CssFallbackValue<T>` autocompleted but forced
every member to one type, and StyleX's signature alone allowed mixed types but offered **zero** completions, because
parameters inferred from arguments have no contextual type to suggest from. The overload pair keeps both and needs no
brand, so `WithEscapeHatch` is untouched by this feature.

### `cssFallback()` for config recipes

Config recipes load before `styled-system/css` exists, so they cannot call `css.fallback()`. `@pandacss/dev` exports the
same thing under the same overload pair:

```ts
import { cssFallback, defineRecipe } from '@pandacss/dev'

defineRecipe({
  className: 'card',
  base: { color: cssFallback('oklch(45% 0.16 250)', '{colors.blue.700}') },
})
```

What it buys over the bare string: arity is a compile error, the function name cannot be silently mistyped, and the
property's keyword union autocompletes inside the call — measured at 13 completions for `position`, versus 0 for a
non-generic signature.

What it does not buy: value validation. `@pandacss/types` has no token unions, and csstype admits `string & {}` for
every property, so any string is a legal config value with or without the helper. Autocomplete and arity, not
correctness.

The separator is interpolated into codegen from `pandacss_shared::FALLBACK_SEPARATOR`, so the parser and the generated
runtime cannot drift. `@pandacss/dev` is the one hand-written copy, pinned by a test asserting it matches
`css.fallback()` for the same values.

### What the string form made unnecessary

- **Config recipes can write the value form directly.** The marker draft _required_ a helper, because a config file
  loads before `styled-system/css` exists and could not build a marker object. A string has no such problem:
  `color: 'fallback(oklch(45% 0.16 250), {colors.blue.700})'` works as written. `cssFallback()` in `@pandacss/dev` is
  therefore optional sugar rather than a dependency of the design — it exists for arity checking and keyword
  autocomplete, which a bare string cannot offer.
- **Patterns need no helper either.** A pattern transform returns a string like any other value, so
  `PatternHelpers.fallback` is optional sugar rather than a requirement.
- **Merging is already correct.** `css.raw({ width: 'fallback(...)' }, { width: '50%' })` yields `50%`, because a string
  is an atomic value. No walker had to learn to stop at a marker.
- **The transform needed no work.** A static `css({ width: css.fallback(...) })` rewrites to its class string and the
  now-dead `css` import is dropped, through the existing paths.

## Importance belongs to the run

`!important` applies to a whole run or to none of it:

```ts
css({ color: 'fallback(oklch(60% 0.2 30), red) !important' })
```

Marking every member individually is accepted and means the same thing. Marking only some is rejected, because an
important declaration beats the others whatever the order, so the rest could never apply:

- `fallback(a !important, b)` leaves `b` unprotected, so a rule elsewhere beats it once `a` turns out unsupported.
- `fallback(a, b !important)` is worse: the fallback always wins, so the preferred value never applies at all.

This needs its own handling because `split_important` takes the first `!` anywhere in a value, which for a run would
hoist one member's marker onto every declaration. `split_run_important` strips only a marker after the closing paren, so
members keep their own and the mix stays visible long enough to reject.

## Diagnostics

Dropping a malformed run silently is the right emit behavior and the wrong developer experience, so every drop is
reported. Seven codes, at two layers.

The extractor reports misuse of the API, where a call span is available:

| Code                          | Severity | Meaning                                   |
| ----------------------------- | -------- | ----------------------------------------- |
| `css_fallback_arity_invalid`  | error    | `css.fallback('x')` — one value           |
| `css_fallback_member_invalid` | error    | an object, array, boolean, or null member |

The stylesheet reports malformed values, which is the only layer that sees a hand-written string:

| Code                                 | Severity | Meaning                                     |
| ------------------------------------ | -------- | ------------------------------------------- |
| `css_fallback_arity_invalid`         | error    | fewer than two members                      |
| `css_fallback_unbalanced`            | error    | unbalanced parens, brackets, or quotes      |
| `css_fallback_nested`                | error    | a member is itself a run                    |
| `css_fallback_importance_mixed`      | error    | only some members are `!important`          |
| `css_fallback_custom_property`       | warning  | a custom property cannot recover reliably   |
| `css_fallback_transform_unsupported` | warning  | members lower to different declaration sets |

The two layers do not double-report. A refused `css.fallback()` never folds to a value, so no atom reaches the
stylesheet; a hand-written string never goes through the extractor's fallback path.

A **dynamic member** is deliberately not a fallback diagnostic. It is an ordinary runtime bailout and already reports
`panda_call_unextractable`, like every other dynamic Panda call.

Severities are fixed. The `validation: none | warn | error` mode gates config validation only, not style diagnostics —
`imported_recipe_raw_dynamic` and the rest work the same way.

Diagnostics are deduplicated per `(property, value)` and sorted by code, because atoms iterate from a hash set and an
unsorted report would vary between runs.

## Tests

- `crates/pandacss_shared/tests/css_fallback.rs`, 16 tests, the parser: nesting, quotes, whitespace, arity, unbalanced
  input, composition, and values that merely mention the name.
- `crates/pandacss_extractor/tests/css_fallback_calls.rs`, 22 tests, folding `css.fallback()`: renamed and namespace
  imports, local constants as members, a local object shadowing the `css` name, `cva.fallback`, every member shape that
  leaves the property open, and the diagnostics with their source spans.
- `crates/pandacss_stylesheet/tests/css_fallback.rs`, 44 tests, emission and diagnostics: declaration order, conditions
  three deep, conditional value objects, responsive arrays, nested selectors, raw `@media`, recipes, slot recipes,
  variants, important runs, minified output, token and shorthand resolution per member, order-sensitive class identity,
  deduplication, token and keyframe survival under pruning, every rejection path, and one diagnostic per code.
- `crates/pandacss_stylesheet/src/style_rules.rs`, run-append semantics, including in-place replacement and importance
  precedence in both directions.
- `crates/pandacss_project/tests/transform/css_cases.rs`, static rewrite plus dead-import cleanup, and the
  dynamic-member bailout.
- `sandbox/codegen/__tests__`, the generated runtime: the written form, runtime/build class parity, and member typing
  under `strictTokens`.

## Related

- [Atomic encoding](./atomic-encoding.md)
- [Native stylesheet compiler](./stylesheet.md)
- [StyleTree](./style-tree.md)
- [CSS custom functions](./css-custom-functions.md)
