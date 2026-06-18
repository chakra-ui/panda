# Recipe Variant Dynamic Diagnostics

## Summary

Warn when a config recipe usage passes a **dynamic variant value**, so only `defaultVariants` CSS is emitted at build
time. This closes the gap where recipe calls and JSX recipe tags silently fall back to defaults — unlike `css()`,
which already surfaces `panda_call_unextractable` when every argument is non-literal.

The diagnostic does **not** change extraction or CSS output. It only makes the JIT recipe contract visible at parse
time and points users to `staticCss: ['*']` or string-literal variant values.

## Diagnostic

| Field | Value |
| ----- | ----- |
| Code | `recipe_variant_dynamic` |
| Severity | `warning` |
| Owner | `pandacss_project` (requires compiled recipe registry) |

Example message:

```text
Recipe `mediaGrid` variant `template` is dynamic — only defaultVariants CSS was emitted. Add `staticCss: ['*']` on the recipe or use a string literal.
```

Use the **recipe config key** (`mediaGrid`), not the JSX tag (`MediaGrid`), in messages.

### Relationship to `panda_call_unextractable`

Recipe function calls are intentionally excluded from `panda_call_unextractable` today — they are partially
extractable (base + defaults always emit). A separate code keeps messages accurate.

Unlike `panda_call_unextractable`, **`recipe_variant_dynamic` stays enabled when `jsxFramework` is configured**.
Dynamic recipe variants are not ambiguous style-object forwarding; they are a distinct JIT limitation.

## Naming alignment (normal path, not an edge case)

Config recipes assume:

- Recipe key `mediaGrid` → JSX tag `MediaGrid` (default `capitalize(name)`, overridable via `jsx`)
- Variant key `template` → JSX attribute `template`

Matching chain for JSX:

1. Extractor records `jsx.name` as written in source (`MediaGrid`, `MediaGrid.Root`, regex-matched tags, …)
2. Project: `find_by_jsx(jsx.name)` → config recipe key(s)
3. For each unresolved prop key: warn only if key ∈ `variant_props` for at least one matched recipe

Dynamic **non-variant** props on the same tag (e.g. `color={themeColor}` on `<Button>`) do **not** get this
diagnostic — they follow the existing atomic style-prop path via `style_props_for_recipes`.

## Layer responsibilities

### Extractor (`pandacss_extractor`)

Record facts; do not know recipe config.

**Recipe calls** — extend `ExtractedCall`:

- `arg_count: u8` — distinguish `mediaGrid()` (silent) from `mediaGrid(arg)` (warn)
- `unresolved_props: Vec<(String, Span)>` — object keys present in source whose values failed
  `expression_to_literal` (populated in `object_to_literal` / call visitor)

**JSX** — extend `ExtractedJsx`:

- `unresolved_props: Vec<(String, Span)>` — attributes that passed `should_extract_prop` but
  `attribute_value` returned `None` (today: silent `return` in `merge_attribute`)

Mirror unresolved-prop tracking in framework template adapters (Vue/Svelte/Astro) where `ExtractedJsx` is produced.

### Project (`pandacss_project`)

Emit diagnostics using compiled state:

**Function calls** (`MatchCategory::Recipe`):

| Condition | Warn |
| --------- | ---- |
| `arg_count > 0` and first arg fully non-literal (`data[0]` is `None`) | yes (call span), unless suppressed |
| `arg_count == 0` | no |
| Partial object: key in `unresolved_props` ∩ `variant_props` | yes (prop span), unless suppressed |
| All variant keys literal | no |

**JSX** (`find_by_jsx(jsx.name)` non-empty):

| Condition | Warn |
| --------- | ---- |
| Prop in `unresolved_props` ∩ `variant_props` for matched recipe(s) | yes (prop span), unless suppressed |
| Prop not a variant key | no |
| Literal variant value | no |

When multiple recipes share a JSX name, warn if the prop is a variant for **any** matched recipe (that is not
suppressed); include the recipe key(s) in the message.

### `staticCss` suppression (v1 — required)

Do **not** warn when static CSS already pre-generates the variant axis the user is driving dynamically. Without this,
everyone who followed the documented fix (`staticCss: ['*']`) gets noisy false positives.

Reuse existing helpers in `recipes.rs`:

- `static_recipe_rules(config)` — merges root `staticCss.recipes`, per-recipe `recipe.staticCss`, and global `*`
- Per-rule expansion already lives in `static_rule_selections` / `static_variant_values`

**Suppress when**, for the matched recipe name:

| Config | Covers |
| ------ | ------ |
| `staticCss: { recipes: '*' }` | all recipes, all variants |
| `recipe.staticCss: ['*']` or `staticCss: { recipes: { mediaGrid: ['*'] } }` | all variants on that recipe |
| `recipe.staticCss: [{ template: ['*'] }]` or `{ template: ['one', 'two'] }` | that variant key (any listed value or `*` within the key) |
| Rule object with only `conditions` / `responsive` | does **not** suppress variant keys by itself |

Implementation sketch — add `RecipeRegistry::static_css_covers_variant(config, recipe_name, variant_key) -> bool`:

1. Resolve rules via `static_recipe_rules` for `recipe_name`
2. If any rule is `Literal::String("*")` → covered
3. If any rule object contains `variant_key` (ignoring `conditions` / `responsive`) → covered
4. Also treat root `staticCss.recipes: '*'` as covering every recipe

Call this before emitting each diagnostic. When multiple recipes match a JSX tag, suppress only for recipes where
coverage holds; warn for the rest.

**Tests:** extend `diagnostics.rs` with a recipe that has `staticCss: ['*']` or `[{ template: ['*'] }]` and assert
no warning on dynamic `template` usage.

### Optional import gating (v1.1)

Today, any `<MediaGrid>` in scanned files is treated as the config recipe if `MediaGrid` is registered — including a
local component that shares the name. Diagnostics inherit that scope.

If false positives appear, tighten to:

- `jsx.kind == JsxKind::Recipe`, and/or
- tag imported from styled-system / recipe `importMap` module

Start **without** import gating in v1; add only if needed.

## Out of scope

- Auto-pregeneration or eager variant emission
- Wrapper prop forwarding (#3522 item 12) — see [jsx-tag-matching](./jsx-tag-matching.md)
- Pattern calls (`MatchCategory::Pattern`) — same machinery later
- Per-file deduplication of warnings
- Changing CSS output

## Implementation phases

### Phase 1 — Recipe function calls

- `arg_count` + fully dynamic first argument
- `static_css_covers_variant` helper (reuse `static_recipe_rules`)
- Tests in `crates/pandacss_project/tests/diagnostics.rs` (including `staticCss: ['*']` suppression)

### Phase 2 — Partial object args

- `unresolved_props` on `ExtractedCall` from `object_to_literal`
- Filter keys against `variant_props` in project

Phases 1 and 2 can ship in one PR (small surface). **`static_css_covers_variant` ships with the first diagnostic PR** — not a follow-up.

### Phase 3 — JSX recipe tags

- `unresolved_props` on `ExtractedJsx` from `merge_attribute`
- Project jsx loop: `find_by_jsx` + `variant_props` filter
- Template adapter parity
- Tests: `diagnostics.rs` + extractor jsx tests

### Phase 4 — Surface + docs

- Add `recipe_variant_dynamic` to `pandacss_shared` diagnostic codes
- Verify `panda check` / report formatting (diagnostics already flow through `ParseFileReport`)
- One line in recipe docs under **Dynamic variant props**

## Files

```
crates/pandacss_shared/src/diagnostic.rs
crates/pandacss_extractor/src/calls.rs
crates/pandacss_extractor/src/literal.rs
crates/pandacss_extractor/src/jsx.rs
crates/pandacss_extractor/src/template_styles.rs
crates/pandacss_project/src/lib.rs
crates/pandacss_project/tests/diagnostics.rs
website/content/docs/concepts/recipes.mdx   (mention the warning)
```

NAPI/wasm: no binding changes unless debug types need the new fields.

## Success criteria

- `mediaGrid({ template: layout })` → warning on `template` with fix hint
- Same usage with `staticCss: ['*']` on the recipe → **silent**
- `<MediaGrid template={layout} />` → same (recipe key in message, not tag)
- `mediaGrid({ template: 'two' })` / `<MediaGrid template="two" />` → silent
- `mediaGrid()` / `<MediaGrid />` → silent
- `<Button color={c} />` with dynamic `color` (non-variant) → no `recipe_variant_dynamic`
- Existing `config_recipes` / dynamic-recipe fallback tests unchanged (behavior + CSS output)

## Related

- [compiler-diagnostics](./compiler-diagnostics.md)
- [jsx-tag-matching](./jsx-tag-matching.md)
- [compound-variant-cascade](./compound-variant-cascade.md)
