<!-- When implementing or fixing something described here, link the relevant -->
<!-- GitHub issue/PR (#3480, #3503, #3492) in commit messages or comments. -->

# Compound Variant Cascade

## Summary

Compound-variant styles must beat the recipe's own base + simple variants (they are the more specific refinement) but
lose to a user `css()` override (the escape hatch). Today they do neither reliably: the static encoder atomizes compound
styles into the **utilities** layer (`pandacss_project::recipes::extend_compound_atoms` → `encoded.atomic`), one layer
_above_ the recipe's base/variants, which are emitted as named groups in the **recipes** layer. So a compound sits next
to `css()` and wins by emit order — `cx(button({…}), css({ bg: 'red' }))` can't override the compound (#3480, #3503).

The fix is to give compounds their own cascade slot: emit them as recipe **groups** (a class + entries, like
base/variants) in a `recipes.compound_variants` sub-layer, so the precedence becomes:

```
@layer reset, base, tokens, recipes, utilities;
@layer recipes.base, recipes.slots, recipes.variants, recipes.compound_variants;
@layer recipes.slots.base, recipes.slots.variants, recipes.slots.compound_variants;
```

`recipes.base < recipes.slots < recipes.variants < recipes.compound_variants` (compound beats the recipe's own styles),
and the whole `recipes` block stays below `utilities`, so `css()` always wins. Slot recipes keep their own internal
order: `base < variants < compound_variants`.

## Static emission

- **Project encoding** (`pandacss_project::recipes`): stop pushing compound styles into `encoded.atomic`. Add
  `encoded.compounds: Vec<RecipeStyleGroupSnapshot>` and encode each matched/eager compound as a grouped style — a
  `class_name` plus its `RecipeStyleEntry`s — the same shape as base/variants. The eager (`emit_eager_compounds`) and
  `smartCompoundVariants` paths change from "emit atoms for every/selected combo" to "emit one **named class** per
  combo".
- **Stylesheet emit** (`pandacss_stylesheet::emitter::write_recipes_layer`): write regular recipe base → slot recipes →
  regular variants → regular compounds into the `recipes.base` / `recipes.slots` / `recipes.variants` /
  `recipes.compound_variants` sub-layers respectively. Slot recipes nest their own `base` / `variants` /
  `compound_variants` order under `recipes.slots`.
- **Layer declaration** (`pandacss_config::CascadeLayers` + the layer-order emit): declare the public top-level layers
  first, then auto-inject recipe and slot recipe sub-layer order; keep `has_layer_declaration` recognizing a user
  stylesheet that declares only the public top-level layers.

## How it carries into the codegen recipes

This is the contract that ties the static sheet and the runtime together: **the compound class name must be identical on
both sides**, because static extraction emits the rule and the runtime emits the `class` attribute that references it.

The compound class is derived deterministically from `(recipeName, sortedCombo)` — e.g.
`button--<hash(type=fill,color=primary)>` — or the author-supplied `compoundVariants[].className` when present (#3492).
The same derivation runs in the Rust emitter (static) and is baked into the generated runtime (dynamic). When class-name
hashing is disabled, generated compound classes use a readable collision-safe suffix:

```
button--compound__size_sm__variant_solid
```

The `compound__` marker prevents single-condition compounds from colliding with regular variant classes like
`button--size_sm`. Variant/value pairs are sorted by variant name; the configured separator is used between each pair's
key and value; pairs are joined with `__`. If a compound condition uses an array, the array means "any of these values"
for matching and is represented in the class name by joining the values with `|`, e.g. `button--compound__size_sm|md`.
The generated CSS selector escapes that `|`, while the runtime returns the unescaped class attribute value.

`pandacss_codegen::generators::recipes` (`RECIPE_RUNTIME_TEMPLATE` / `createRecipe`):

- `createRecipe` keeps `compounds` from the normalized config. `__getCompoundVariantCss__` returns the matching compound
  class name(s) for the resolved props — the same name the static emitter produced.
- Runtime matching preserves compound array semantics: `size: ['sm', 'md']` matches either `size: 'sm'` or `size: 'md'`,
  and both return the same compound group class. Non-matching values (e.g. `size: 'lg'`) do not return it.
- The public `recipeFn(props)` returns `cx(recipeCss(resolve(props)), <matched compound classes>)`. This closes the
  runtime gap where a direct `button({…})` call dropped compounds (the JSX factory applied them via
  `__getCompoundVariantCss__`, direct calls did not) — and it no longer reintroduces the override problem, because the
  compound class now lives in `recipes.compound_variants`, below `utilities`.
- The JSX factory keeps calling `composedRecipeFn(variantProps, false)` so it doesn't double-apply; `false` means "give
  me the recipe class without compounds" and the factory appends the compound classes itself via
  `__getCompoundVariantCss__`. Both paths now resolve to the **named class**, not recomputed atomic CSS.

Generated **config recipe** metadata carries only the data needed for runtime class lookup:

- regular recipes: variant match keys plus `className`
- slot recipes: variant match keys plus `classNames`

The generated config recipe metadata does **not** carry `compound.css`; those styles have already been emitted
statically into `recipes.compound_variants`. `getSlotCompoundVariant` supports both shapes: the lean generated
config-recipe shape (`classNames` only) and the public runtime `sva` shape (`css` per slot).

Net: config recipe runtime ships a combo→className lookup, not a CSS-object builder, which is smaller, matches the
static sheet exactly, and works identically for `<Button>` and `button(...)`.

## The config-recipe vs `cva` fork

The sub-layer plan works because **config recipe** base/variants are named groups in the `recipes` layer. **Atomic
recipes (`cva`)** keep base/variants as deduped atoms in `utilities` (the "stay atomic" property large adopters rely on,
#3522), so their compounds can't drop into `recipes.compound_variants` — they'd fall _below_ their own base/variants and
stop applying.

So one concept, two implementations:

- **config recipes** → named compound class in the `recipes.compound_variants` sub-layer (this note), with generated
  runtime matching class names only.
- **`cva` / `sva`** → runtime CSS-object merge still uses `getCompoundVariantCss`; compound `css` remains part of the
  public runtime recipe config because those styles are generated dynamically as utility atoms. The helper ignores
  `className` / `classNames` metadata during matching so runtime compounds can coexist with the generated config-recipe
  shape.

Both yield `compound > variants` and `compound < css()`; they differ only because one side is named and the other is
atomic.

## Notes

- `smartCompoundVariants` controls whether config recipe compound groups are emitted eagerly on first usage or only when
  selected. In both modes the emitted result is a named group, not atomic CSS.
- The public runtime `cva` / `sva` path remains intentionally separate from config recipes. It keeps compound CSS
  objects because there is no pre-emitted static class to reference.

## Related

- [Native stylesheet compiler](./stylesheet.md) — layer assembly, recipe layer, ordering.
- [Atomic encoding](./atomic-encoding.md) — recipe entry serialization, compound processing.
- [Codegen design](./codegen-design.md) — recipe runtime emission.
