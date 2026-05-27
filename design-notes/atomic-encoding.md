# Atomic Encoding

## Summary

The `pandacss_encoder` crate decomposes typed style objects (`Literal::Object`) and recipe models (`Recipe`,
`SlotRecipe`) into a flat set of `Atom` records — one per `(prop, value, condition_chain)` triple. The emitter turns
those atoms into CSS rules; the encoder doesn't care about CSS syntax. Dedup happens via `FxHashSet<Atom>`.

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

`Recipe` and `SlotRecipe` (the `pandacss_recipes` crate) decompose into the same `Atom` shape via three entry points:

- `process_atomic(style)` — one style object.
- `process_atomic_recipe(recipe)` — every style across `base`, variant options, and compound variants.
- `process_atomic_slot_recipe(slot_recipe)` — same, per slot.

`atomic_styles` and `atomic_styles_per_slot` return lazy iterators — no intermediate `Vec` allocation. The encoder
consumes lazily so the caller never pays for a full materialization.

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
