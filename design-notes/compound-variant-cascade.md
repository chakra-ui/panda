<!-- When implementing or fixing something described here, link the relevant -->
<!-- GitHub issue/PR (#3480, #3503, #3492) in commit messages or comments. -->

# Compound Variant Cascade

## Summary

Compound-variant styles must beat the recipe's own base + simple variants (they
are the more specific refinement) but lose to a user `css()` override (the
escape hatch). Today they do neither reliably: the static encoder atomizes
compound styles into the **utilities** layer (`pandacss_project::recipes::extend_compound_atoms`
→ `encoded.atomic`), one layer _above_ the recipe's base/variants, which are
emitted as named groups in the **recipes** layer. So a compound sits next to
`css()` and wins by emit order — `cx(button({…}), css({ bg: 'red' }))` can't
override the compound (#3480, #3503).

The fix is to give compounds their own cascade slot: emit them as recipe
**groups** (a class + entries, like base/variants) in a `recipes.compound_variants`
sub-layer, so the precedence becomes:

```
@layer reset, base, tokens,
       recipes.base, recipes.variants, recipes.compound_variants,
       utilities;
```

`base < variants < compound_variants` (compound beats the recipe's own styles),
and the whole `recipes` block stays below `utilities`, so `css()` always wins.
The existing `recipes.slots` sub-layer (`emitter::write_recipe_group_refs`) is
the precedent to copy.

## Static emission

- **Project encoding** (`pandacss_project::recipes`): stop pushing compound
  styles into `encoded.atomic`. Add `encoded.compounds: Vec<RecipeStyleGroupSnapshot>`
  and encode each matched/eager compound as a grouped style — a `class_name`
  plus its `RecipeStyleEntry`s — the same shape as base/variants. The eager
  (`emit_eager_compounds`) and `smartCompoundVariants` paths change from "emit
  atoms for every/selected combo" to "emit one **named class** per combo".
- **Stylesheet emit** (`pandacss_stylesheet::emitter::write_recipes_layer`):
  write base → variants → compounds into the `recipes.base` / `recipes.variants`
  / `recipes.compound_variants` sub-layers respectively (slot recipes keep their
  `.slots` nesting).
- **Layer declaration** (`pandacss_config::CascadeLayers` + the layer-order
  emit): declare the three recipe sub-layers in order; keep `has_layer_declaration`
  recognizing the stylesheet root.

## How it carries into the codegen recipes

This is the contract that ties the static sheet and the runtime together: **the
compound class name must be identical on both sides**, because static extraction
emits the rule and the runtime emits the `class` attribute that references it.

The compound class is derived deterministically from `(recipeName, sortedCombo)`
— e.g. `button--<hash(type=fill,color=primary)>` — or the author-supplied
`compoundVariants[].className` when present (#3492). The same derivation runs in
the Rust emitter (static) and is baked into the generated runtime (dynamic).

`pandacss_codegen::generators::recipes` (`RECIPE_RUNTIME_TEMPLATE` / `createRecipe`):

- `createRecipe` keeps `compounds` from the normalized config. Today
  `__getCompoundVariantCss__` calls `getCompoundVariantCss(compounds, …)` to
  build a style object and routes it through `css()` (atomic). It changes to
  **return the matching compound class name(s)** for the resolved props — the
  same name the static emitter produced.
- The public `recipeFn(props)` returns `cx(recipeCss(resolve(props)), <matched
  compound classes>)`. This closes the runtime gap where a direct `button({…})`
  call dropped compounds (the JSX factory applied them via
  `__getCompoundVariantCss__`, direct calls did not) — and it no longer
  reintroduces the override problem, because the compound class now lives in
  `recipes.compound_variants`, below `utilities`.
- The JSX factory keeps calling `composedRecipeFn(variantProps, false)` so it
  doesn't double-apply; `false` means "give me the recipe class without
  compounds" and the factory appends the compound classes itself via
  `__getCompoundVariantCss__`. Both paths now resolve to the **named class**, not
  recomputed atomic CSS.

Net: the codegen runtime stops shipping `getCompoundVariantCss` as a CSS-object
builder and ships a combo→className lookup instead, which is smaller, matches
the static sheet exactly, and works identically for `<Button>` and `button(...)`.

## The config-recipe vs `cva` fork

The sub-layer plan works because **config recipe** base/variants are named groups
in the `recipes` layer. **Atomic recipes (`cva`)** keep base/variants as deduped
atoms in `utilities` (the "stay atomic" property large adopters rely on, #3522),
so their compounds can't drop into `recipes.compound_variants` — they'd fall
_below_ their own base/variants and stop applying.

So one concept, two implementations:

- **config recipes** → named compound class in the `recipes.compound_variants`
  sub-layer (this note).
- **`cva`** → provenance-ordered emit _within_ `utilities` (`base → variants →
  compound → dynamic/css`), tagging each utility atom with its origin and
  sorting on it, so `css()` still emits last and wins while compound atoms still
  beat variant atoms — all without losing cross-atom dedup.

Both yield `compound > variants` and `compound < css()`; they differ only because
one side is named and the other is atomic.

## Unresolved Questions

- Default vs opt-in. Base/variants stay atomic, so this doesn't regress the
  all-atomic story, but it moves class names + cascade — likely opt-in first
  (like `optimize.smartCompoundVariants`) or gated for a v2 major.
- Compound class naming: hash of the sorted combo vs author `className`. Hash is
  automatic but opaque; `className` (#3492) is predictable but optional.
- Whether the `cva` provenance-ordering path is worth doing now or deferred —
  the reported breakage (#3480) is a config recipe; `cva` compounds may be an
  acceptable follow-up.
- CSS-output contract: every recipe/compound snapshot moves. Needs broad review
  (atomic-rule, recipe, bench parity) and sign-off before it lands.

## Related

- [Native stylesheet compiler](./stylesheet.md) — layer assembly, recipe layer, ordering.
- [Atomic encoding](./atomic-encoding.md) — recipe entry serialization, compound processing.
- [Codegen design](./codegen-design.md) — recipe runtime emission.
