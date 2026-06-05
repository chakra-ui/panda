# Atomic Encoding

## Summary

The `pandacss_encoder` crate decomposes typed style objects (`Literal::Object`) and recipe models (`Recipe`,
`SlotRecipe`) into a flat set of `Atom` records — one per `(prop, value, condition_chain)` triple. Config recipes reuse
the same serialization path and then convert atoms into `RecipeStyleEntry` records so stylesheet emission can group
rules under recipe class names. The encoder doesn't care about CSS syntax. Dedup happens via `FxHashSet<Atom>` for
atomic styles and `FxHashSet<RecipeStyleEntry>` for grouped recipe entries.

## The Atom

```rust
pub struct Atom {
    pub prop: Box<str>,
    pub value: AtomValue,
    pub conditions: SmallVec<[Box<str>; INLINE_CONDS]>,
}
```

Three perf choices worth noting:

- **`Box<str>` not `String`.** Atoms are write-once after the encoder records them — no capacity field needed. Saves 8
  bytes per string.
- **`SmallVec<[…; 2]>` for conditions.** Real Panda usage shows 0-2 conditions per atom (`{ _hover: { md: … } }`); 3+
  falls back to heap. The inline budget is sized to cover the common case at zero heap cost.
- **Numbers stored as their JS string form** (`AtomValue::Number(Box<str>)`). `Atom` needs `Hash` for dedup; `f64` isn't
  `Eq`. Round-tripping through `to_string()` preserves the integer/float distinction the JS extractor produces.

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

`RecipeStyleEntry` is not a second style serializer. It is the grouped-recipe IR used after serialization, when the
stylesheet emitter needs to write declarations under a recipe class name instead of atomic utility class names.
`RecipeStyleGroup::conditions` are class conditions from the selected variant value, such as
`size={{ md: "lg" }}`. They are allowed to prefix the recipe class because the generated recipe runtime returns that
conditional class. `RecipeStyleEntry::conditions` are nested conditions from the recipe style object itself, such as
`variants.size.lg._hover`; these apply to the fixed recipe class selector and must not be folded into the class name.

The conversion is intentionally mechanical:

```rust
impl From<Atom> for RecipeStyleEntry { /* prop, value, conditions, important */ }
```

This keeps the `(prop, value, condition_chain, important)` semantics owned by `Atom` / `Encoder`. Recipe-specific code
keeps selection conditions on the surrounding `RecipeStyleGroup` after atomic serialization instead of mutating the
entry's existing condition chain.

## Walker

The encoder is stateful — `Encoder<C>` owns a `path` buffer reused across walks:

```rust
pub struct Encoder<C: ConditionMatcher> {
    conditions: C,
    atoms: FxHashSet<Atom>,
    path: SmallVec<[PathSegment; 8]>,
}
```

The walker descends with push, ascends with pop on the shared `path`:

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

That gives O(depth) allocation per walk root, not O(depth²) as a clone-on-descend implementation would. The 8-segment
inline budget covers the ≤8-deep case (every real style object) without spilling.

## Property selection rule

For a leaf, the property name is the **outermost non-condition key**:

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

`find` walks outer→inner so the first non-condition wins. The condition chain is everything that _was_ a condition, in
the same order, with `"base"` filtered out (it's not a real condition, just a shorthand for "no conditions apply").

## Condition matcher

```rust
pub trait ConditionMatcher {
    fn is_condition(&self, key: &str) -> bool;
}
```

There is no built-in default condition set in the encoder. Callers must derive condition names from the resolved Panda
config and pass a matcher explicitly. In practice that means `base`, underscore-prefixed aliases for configured
condition keys (`hover` → `_hover`), and configured breakpoint names. Test fixtures that rely on the standard breakpoint
names provide `base`, `sm`, `md`, `lg`, `xl`, and `2xl` explicitly.

`ConditionSet` is the shared matcher for callers that only need name lookup. It also treats raw selector / at-rule
keys as conditions (`&:hover`, `@media ...`), matching Panda's inline condition behavior without hard-coding named
conditions into the encoder.

## Recipe decomposition

`Recipe` and `SlotRecipe` (the `pandacss_recipes` crate) decompose into the same `Atom` shape via four entry points:

- `process_atomic(style)` — one style object, no normalization.
- `process_atomic_with(style, &normalizer)` — fused walker: applies inline key resolution + leaf normalization +
  responsive-array expansion in a single pass over the input. Avoids the upfront `StyleNormalizer.normalize` call and
  the `Cow<Literal>` it produces. The project layer drives this with `pandacss_utility::StyleNormalizer`.
- `process_atomic_recipe(recipe)` — every style across `base`, variant options, and compound variants.
- `process_atomic_slot_recipe(slot_recipe)` — same, per slot.

`atomic_styles` and `atomic_styles_per_slot` return lazy iterators — no intermediate `Vec` allocation. The encoder
consumes lazily so the caller never pays for a full materialization.

## Config recipe serialization

Config recipe `base` blocks and variant option style objects must pass through the same serialization path as normal
`css()` calls. The project layer does this by driving `Encoder::process_atomic_with(style, &StyleNormalizer)` and then
mapping each `Atom` into a `RecipeStyleEntry`.

This is a deliberate parity rule with the legacy TypeScript engine: `StyleEncoder.hashStyleObject` serialized atomics,
recipe base styles, and recipe variant selections. Rust should not maintain a separate recipe-only style walker.

Keeping one walker matters for condition correctness. Condition-first recipe shapes are valid:

```js
{
  _hover: { padding: "4" },
  md: { gap: "2" },
  "&:first-child": {
    "&:hover": { color: { base: "red", md: "gray" } }
  }
}
```

The encoder's property rule still applies: first non-condition segment is the property, and every condition segment
except `base` remains in the entry condition chain. If a recipe call selects a variant responsively, that selection
condition is stored on the recipe group:

```rust
RecipeStyleGroup {
    class_name: "btn--size_lg".into(),
    conditions: selected_variant_conditions,
    entries,
}
```

Recipe grouping, slot resolution, default variants, compound variants, and watch-mode refcounting remain in
`pandacss_project`; only style-object serialization is shared with atomics.

Do not reintroduce a recipe-specific recursive walker in `pandacss_project`. If encoding semantics change, change
`pandacss_encoder` and let both atomic styles and recipe entries inherit the behavior.

## Inline normalization — `NormalizeAtomic`

`process_atomic_with` takes any `&N` where `N: NormalizeAtomic`. The trait has three method hooks with no-op defaults:

```rust
pub trait NormalizeAtomic {
    fn resolve_key<'a>(&'a self, key: &'a str) -> &'a str { key }
    fn normalize_leaf<'a>(&self, _prop: &str, value: &'a Literal) -> Cow<'a, Literal> {
        Cow::Borrowed(value)
    }
    fn array_condition(&self, _index: usize) -> Option<&str> { None }
}
```

Encoder doesn't depend on `pandacss_utility`; `StyleNormalizer` implements the trait inside `pandacss_utility` (the
one sibling-Tier-2 dep utility takes on encoder). Callers that don't need normalization can pass the zero-cost
`NoNormalize` marker or just call `process_atomic` instead.

The fusion eliminates the prior "normalize tree → walk normalized tree" double walk; on the sandbox bench it dropped
the `encoding_atomic` span from ~3.47 ms to ~1.67 ms (-52%), ~12 % of cold path at 500 unique files.

## Atomic styles per slot — PERF tradeoff

`SlotRecipe::atomic_styles_per_slot` filters base / variants / compound for every slot, giving O(slots × styles) total
work. The lazy iterator shape is deliberate: callers that only need one slot pay only that slot's cost. If multi-slot
consumers come to dominate a profile, pre-bucketize once into `FxHashMap<&str, Vec<&Literal>>` and hand out borrowed
slices — but until benches force the change, the simpler shape wins.

## Encoder is single-pass per file

The project creates `Encoder::with_conditions(config_conditions)` per file, feeds every style / recipe extracted from
that file, then calls `into_atoms()` to hand the set off to the project. The project's `parse_file` does exactly this.
`into_atoms()` is cheaper than `atoms().clone()` — the inner set moves out, no re-hash.

## Related

- [crate-layering](./crate-layering.md)
- [literal-evaluator](./literal-evaluator.md)
- [project-lifecycle](./project-lifecycle.md)
- [performance-budget](./performance-budget.md)
