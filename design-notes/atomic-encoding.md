# Atomic Encoding

## Summary

`pandacss_encoder` decomposes typed style objects (`Literal::Object`) and recipe models (`Recipe`, `SlotRecipe`) into a
flat `FxHashSet<Atom>` — one `Atom` per `(prop, value, condition_chain)`. Config recipes reuse the same path, then map
atoms into `RecipeStyleEntry` so the emitter can group rules under recipe class names. The encoder is CSS-syntax-agnostic;
dedup is via the hash sets.

## The Atom

```rust
pub struct Atom {
    pub prop: Box<str>,
    pub value: AtomValue,
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
}
```

Three perf choices:

- **`Box<str>` not `String`** — atoms are write-once, so no capacity field (−8 bytes/string).
- **`SmallVec<[…; 2]>` conditions** — real usage is 0–2 conditions/atom (`{ _hover: { md: … } }`); 3+ spills to heap.
- **Numbers as their JS string form** (`AtomValue::Number(Box<str>)`) — `Atom: Hash` needs `Eq`, which `f64` lacks; the
  string round-trips and preserves the integer/float distinction.

## RecipeStyleEntry

```rust
pub struct RecipeStyleGroup {
    pub class_name: Box<str>,
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
    pub entries: FxHashSet<RecipeStyleEntry>,
}

pub struct RecipeStyleEntry {
    pub prop: Box<str>,
    pub value: AtomValue,
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
    pub important: bool,
}
```

`RecipeStyleEntry` is the grouped-recipe IR (not a second serializer): the emitter writes declarations under a recipe
class name. `RecipeStyleGroup::conditions` are class conditions from the selected variant (`size={{ md: "lg" }}`) — they
may prefix the recipe class because the runtime returns that conditional class. `RecipeStyleEntry::conditions` are nested
conditions from the style object (`variants.size.lg._hover`) — they apply to the fixed class selector and must **not**
fold into the class name. Group condition order is runtime-visible and must be preserved in class names
(`md:hover:btn--size_lg` ≠ `hover:md:btn--size_lg`); the sorter's cascade-sorted view is for rule placement only, never
runtime selectors.

Conversion is mechanical (`impl From<Atom> for RecipeStyleEntry`), keeping `(prop, value, conditions, important)` owned
by `Atom`/`Encoder`. Recipe code keeps selection conditions on the surrounding `RecipeStyleGroup` rather than mutating
the entry chain.

## Walker

`Encoder<C>` is stateful, reusing a `path` buffer across walks:

```rust
pub struct Encoder<C: ConditionMatcher> {
    conditions: C,
    atoms: FxHashSet<Atom>,
    path: SmallVec<[PathSegment; 8]>,
}
```

It descends with push, ascends with pop:

```rust
fn walk(&mut self, value: &Literal) {
    if let Literal::Object(entries) = value {
        for (key, child) in entries {
            self.path.push(/* segment */);
            self.walk(child);
            self.path.pop();
        }
        return;
    }
    if let Some(atom) = self.atom_from_path(value) {
        self.atoms.insert(atom);
    }
}
```

O(depth) allocation per root (not O(depth²) like clone-on-descend); the 8-segment inline budget covers every real
(≤8-deep) object.

## Conditional expansion

A `Literal::Conditional(branches)` (a non-foldable ternary — see `literal-evaluator.md`) could resolve to **any** branch
at runtime, so both walkers (`walk` and `walk_with`) recurse into every branch under the **same** path and emit each
branch's atoms — the union, not a choice. `{ color: cond ? 'red' : 'blue' }` → `.c_red` + `.c_blue`; a conditional value
under a condition (`{ _hover: cond ? a : b }`) keeps `_hover` on both branches; nested conditionals expand recursively.
Conditionals are therefore consumed before reaching a leaf and never produce a degenerate `?(red|blue)` value. The two
walkers must stay in sync here.

Conditionals expand at **two levels**, because an array means different things in each position (merge-list as a `css()`
arg, responsive array as a property value):

- **Value-level** (a conditional *inside* a style object, `{ margin: cond ? '3' : '5' }`, or a recipe / cva / sva
  value) — the encoder walker expands it here. An array branch at this level (`{ margin: cond ? ['1', '2'] : '5' }`) is
  correctly responsive.
- **Arg-level** (a conditional *as* a `css()` argument, `css(cond ? a : b)`) — `Project::process_css_arg` expands it
  before the encoder, recursing into each branch as its own arg. This is what keeps an array inside a branch
  (`css(cond ? [a, b] : c)`) a **merge-list** (both unconditional), matching node's arg-level flattening — the encoder
  never sees that array, so it can't mistake it for responsive. `process_css_arg` handles `Literal::Array` (merge-list)
  and `Literal::Conditional` (branches) identically: recurse, skip `null` / `false`, send only leaf objects to
  `process_atomic`.

## Property selection rule

The leaf property is the **outermost non-condition key**:

```js
{
  _hover: {
    md: {
      color: 'red'
    }
  }
}
//   condition  condition  property = "color"
```

`find` walks outer→inner (first non-condition wins); the condition chain keeps every condition segment in order, minus
`base` (a "no conditions apply" shorthand).

## Condition matcher

```rust
pub trait ConditionMatcher {
    fn is_condition(&self, key: &str) -> bool;
}
```

No built-in default set — callers derive condition names from the resolved config: `base`, underscore aliases for
condition keys (`hover` → `_hover`), and breakpoint names. (Test fixtures supply `base, sm, md, lg, xl, 2xl`.)
`ConditionSet` is the shared name-lookup matcher; it also treats raw selector / at-rule keys (`&:hover`, `@media …`) as
conditions, matching Panda's inline behavior.

### Unresolved `_`-prefixed conditions are dropped

A `_`-prefixed key that the matcher doesn't recognize (a typo like `_hovr`, or `_print` when `print` isn't configured)
is an unresolved condition reference — the `_` prefix is exclusively Panda's condition marker (custom properties use
`--`), so it's never a valid property. `atom_from_path` emits **nothing** for any path carrying such a segment, rather
than the old degenerate `_hovr: …` declaration. The project surfaces the mistake during parse with an
`unknown_condition` warning (plus a closest-match "did you mean `_hover`?" via `pandacss_shared::closest_match`); the
encoder drop and the diagnostic share the same predicate (`_`-prefixed && not a condition) so they never disagree. Bare
non-condition keys (no `_`) are unaffected — they stay on the property path.

## Recipe decomposition

`Recipe` / `SlotRecipe` (`pandacss_recipes`) decompose into `Atom`s via four entry points:

- `process_atomic(style)` — one object, no normalization.
- `process_atomic_with(style, &normalizer)` — fused walker (inline key resolution + leaf normalization +
  responsive-array expansion in one pass), avoiding the upfront `StyleNormalizer.normalize` and its `Cow<Literal>`.
  Driven with `pandacss_utility::StyleNormalizer`.
- `process_atomic_recipe(recipe)` — base, variant options, compound variants.
- `process_atomic_slot_recipe(slot_recipe)` — same, per slot.

`atomic_styles` / `atomic_styles_per_slot` return lazy iterators — no intermediate `Vec`.

## Config recipe serialization

Recipe `base` blocks and variant option styles pass through the same path as `css()` calls:
`Encoder::process_atomic_with(style, &StyleNormalizer)`, then map each `Atom` → `RecipeStyleEntry`. This mirrors legacy
`StyleEncoder.hashStyleObject` (which serialized atomics, recipe base, and variant selections) — Rust keeps no separate
recipe walker.

One walker matters for condition correctness; condition-first shapes are valid:

```js
{
  _hover: { padding: "4" },
  md: { gap: "2" },
  "&:first-child": {
    "&:hover": { color: { base: "red", md: "gray" } }
  }
}
```

The property rule still holds (first non-condition segment is the prop; every condition except `base` stays in the
chain). A responsively-selected variant stores its selection on the group:

```rust
RecipeStyleGroup {
    class_name: "btn--size_lg".into(),
    conditions: selected_variant_conditions,
    entries,
}
```

`selected_variant_conditions` keeps the path as written: `size: { md: { _hover: "lg" } }` → `[md, _hover]`;
`size: { _hover: { md: "lg" } }` → `[_hover, md]`.

Recipe grouping, slot resolution, default / compound variants, and watch refcounting stay in `pandacss_project`; only
style-object serialization is shared. Don't reintroduce a recipe-specific walker — change `pandacss_encoder` and both
atomic styles and recipe entries inherit it.

## Inline normalization — `NormalizeAtomic`

`process_atomic_with` takes any `&N: NormalizeAtomic`, a trait with three no-op-default hooks:

```rust
pub trait NormalizeAtomic {
    fn resolve_key<'a>(&'a self, key: &'a str) -> &'a str { key }
    fn normalize_leaf<'a>(&self, _prop: &str, value: &'a Literal) -> Cow<'a, Literal> {
        Cow::Borrowed(value)
    }
    fn array_condition(&self, _index: usize) -> Option<&str> { None }
}
```

Encoder doesn't depend on `pandacss_utility`; `StyleNormalizer` implements the trait there. Callers needing no
normalization pass the zero-cost `NoNormalize` marker or call `process_atomic`. The fusion drops the prior
normalize-then-walk double pass — `encoding_atomic` ~3.47 ms → ~1.67 ms (−52%) on the sandbox bench (500 files).

## Atomic styles per slot — PERF tradeoff

`SlotRecipe::atomic_styles_per_slot` re-filters base / variants / compound per slot — O(slots × styles). The lazy shape
is deliberate (one-slot callers pay one slot's cost). If multi-slot consumers dominate a profile, pre-bucketize into
`FxHashMap<&str, Vec<&Literal>>`; until benches force it, the simpler shape wins.

## Encoder is single-pass per file

The project creates `Encoder::with_conditions(config_conditions)` per file, feeds every extracted style / recipe, then
`into_atoms()` hands off the set (cheaper than `atoms().clone()` — moves, no re-hash). `parse_file` does exactly this.

## Custom-utility JS transforms — carrier atom + override map

A custom utility's `transform` returns a multi-declaration object that must emit **one** class keyed on the utility
(`spaceX: '4'` → `.space-x_4 { … }`), not per-property atoms. The callback runs at the binding (the Rust emitter can't
call JS), so its result is carried to emit, not decomposed:

- **Carrier atom.** `transform_atoms` keeps the original `{prop, value, conditions, important}` atom (node's
  `StyleEntry` keying) and records the JS result in a `(prop, value) → Literal` override map.
- **Token resolution.** `Utility::resolve_values_value` resolves the `values` category before the call; the callback
  gets the resolved value, `args.raw` the original (node's `getPropertyRawValue` order).
- **Override map.** Refcounted alongside `atoms_cache` (atom + styles add/remove together); surfaced via
  `StylesheetInput.utility_styles`.
- **Emit.** `transform_atom_styles` swaps the styles into the `transform_str` result (className/layer stay in one
  place). Flat objects emit as direct declarations (source order); nested ones (conditions / child selectors) take the
  composition grouping path (`style_object_entries`).
- **Recipes** re-encode the resolved object through the `Encoder` into `RecipeStyleEntry`s (no per-utility class —
  entries flatten into the recipe).

## Related

- [crate-layering](./crate-layering.md)
- [literal-evaluator](./literal-evaluator.md)
- [project-lifecycle](./project-lifecycle.md)
- [performance-budget](./performance-budget.md)
