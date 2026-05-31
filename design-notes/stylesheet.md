# Native Stylesheet Compiler

## Summary

`pandacss_stylesheet` is the native CSS emission crate. It consumes a resolved `UserConfig`, borrowed dynamic atoms from
`Project`, and recipe snapshots, then returns formatted or writer-minified CSS. It intentionally emits CSS; it does not
run a CSS-aware optimizer today.

The crate replaced the earlier planned split between `pandacss_emitter` and `pandacss_optimizer`. Keeping emission,
static CSS expansion, and writer formatting in one crate gives a smaller dependency surface while the optimizer phase is
not implemented. If a real optimizer lands, it should be CSS-aware (for example `lightningcss`) rather than a raw
whitespace pass.

## Ownership

The stylesheet crate owns:

- Dynamic atomic CSS emission from `Atom` records.
- Config recipe and slot recipe CSS emission from `EncodedRecipesSnapshot`.
- Reset CSS emission via `preflight.rs` when `config.preflight.enabled()`. Rules live as `&'static` data in `.rodata`,
  walked straight into the writer with zero per-emit allocation when unscoped. `preflight.scope` / `preflight.level` are
  honored: `parent` (default) descendant-prefixes each selector (`{scope} {sel}`), `element` compound-appends
  (`{sel}{scope}`) except standalone pseudo-elements (`::placeholder`) which fall back to descendant. Scoping rewrites
  selectors at emit time (allocating); the unscoped path stays zero-alloc.
- Tokens-layer emission:
  - Token CSS variable declarations from the resolved `TokenDictionary`, including condition-scoped variants.
  - `theme.keyframes` blocks as `@keyframes name { selector { decl } }` via a purpose-built walker (not the
    `serialize_styles` path) — flat selector→declarations with no condition resolution, nested rules, or shorthand
    expansion.
- Base-layer config CSS emission from serialized `globalCss`.
- Base-layer `globalVars` emission:
  - string values become custom property declarations under `cssVarRoot`, defaulting to `:where(:root, :host)`
  - object values become top-level `@property` registrations
  - malformed entries are ignored rather than diagnosed
- Base-layer `globalFontface` (`@font-face`) and `globalPositionTry` (`@position-try`) emission:
  - each entry's value may be a single rule object or an array (one block per rule)
  - `globalFontface` writes `font-family` from the key, then the rule's descriptors
  - `globalPositionTry` dashed-ident-normalizes the key (`flip` → `--flip`)
  - array-valued descriptors (e.g. multi-source `src`) join with `,`, matching v1
- The supported native `staticCss` subset:
  - `staticCss.css`
  - `staticCss.recipes`
  - global `staticCss.recipes: "*"`
  - recipe-level `recipe.staticCss`
  - recipe wildcard variants
  - base recipe styles
  - slot recipes
  - compound variant CSS
  - static responsive and configured condition expansion
- Layer declarations and non-empty layer blocks.
- Custom cascade layer names via `config.layers` (rename-only — same five layers in the same fixed order, just
  user-controllable strings). Collisions between renamed layers surface a `layer_name_collision` warning per
  unique colliding name.
- Custom utility sub-layers via `utilities.<prop>.layer: "X"`. Atoms with an override are bucketed at emit and
  emitted as `@layer X { ... }` **nested inside** the `@layer utilities` wrapper — matches v1's
  `Layers.getLayerRoot('utilities')` shape (default atoms first, then each sub-layer). The user's chosen name
  appears verbatim in the output; no `utilities.` prefix synthesis. Custom sub-layers are not yet declared in the
  `@layer ...;` order preamble (they cascade implicitly inside the utilities slot).
- Modern breakpoint media syntax (`@media (width >= 48rem)`).
- Writer-level minification: omit indentation/newlines/optional declaration spaces.

The stylesheet crate does **not** own:

- Theme token artifact files (only the runtime token CSS layer is emitted here; codegen output stays on the JS side).
- `staticCss.patterns` or `staticCss.themes`; unsupported native paths report diagnostics instead of silently emitting
  partial CSS.
- CSS parsing, rule merging, prefixing, shorthand folding, or AST minification.
- Incremental stylesheet patching for watch mode.

`globalVars` intentionally remains regular CSS variable output. It does not emit Tailwind-style `@theme`, does not
create utility namespaces, and does not generate utility classes. For `@property` registrations, `syntax` and `inherits`
are required. `initialValue` is required unless `syntax` is the universal syntax (`"*"`); typed registrations missing an
initial value are skipped because the resulting CSS rule would be invalid.

## Ordering

Final CSS ordering is owned by `pandacss_stylesheet::sort`. The model is based on cascade priority, not on extraction
or insertion order:

1. Rule bucket: base/unconditional rules, selector-only variants, then at-rule and mixed at-rule variants.
2. At-rule priority: supports, media, container, print, then other at-rules. Width queries are normalized for sorting:
   max-width style queries sort before min-width style queries; max-width sorts descending and min-width sorts
   ascending.
3. Selector priority: configured pseudo selectors use a broad pseudo-class priority table. Unknown pseudo-classes sort
   early, structural and form states sort before interactive states, and the core interactive sequence is
   `:focus-within`, `:hover`, `:focus`, `:focus-visible`, `:active`.
4. Property priority: broad shorthands sort before shorthand groups, which sort before longhands, so more specific
   declarations can win inside the same condition bucket. Axis shorthands use inline/x before block/y as a deterministic
   tie-breaker.
5. Deterministic ties: property name, atom value key, then condition names.

The output order is an explicit priority key instead of an incidental extraction order. It keeps Panda's variant
semantics: responsive/at-rule rules still come after base rules, pseudo selectors keep predictable state ordering, and
utility shorthand/longhand conflicts are handled within each condition bucket.

Pseudo-elements are a selector-construction concern, not just a sort concern: pseudo-classes are emitted before
pseudo-elements. Panda follows that rule during condition application because CSS pseudo-elements must appear after the
other components of the compound selector; `.x:hover::before` is valid, while `.x::before:hover` is not the selector
shape we want for normal utility variants.

The sort key is precomputed once per atom or recipe entry, so the `O(N log N)` comparator does not repeatedly parse
conditions or allocate. The atom value tie-breaker remains allocation-free: `(discriminant, &str)`.

Condition application has a separate ordering concern from rule sorting. Mixed conditions such as
`["@media (hover: hover)", "&:hover"]` emit every condition part, with wrappers applied before selector modifiers and
pseudo-elements applied after pseudo-classes. This keeps selectors such as `:hover::before` valid while preserving
deterministic class names.

## Performance Shape

`Project.compile()` passes borrowed atoms into `pandacss_stylesheet::compile()`. Static atoms are held in a local owned
buffer and appended as borrowed references, avoiding a deep clone of the project-wide atom set.

`compile()` builds `TokenDictionary` and `Utility` once per call and shares that instance between static CSS expansion
and emission. The emitter avoids per-comparator heap allocation, uses `Cow<str>` for common declaration values, and keeps
owned class names owned through prefix formatting where possible.

`merge_encoded_recipes()` is skipped when the static recipe snapshot is empty, avoiding a full recipe snapshot clone for
projects that do not use native static recipes.

The current build/watch emit cost is still `O(total atoms log total atoms)` per `compile()` call. This is acceptable for
cold builds after the allocation fixes, but it is not an incremental watch-mode design. A future cached emitter would
need a different API: per-file or per-bucket emitted CSS, invalidation by changed atoms, and stable ordering across
affected buckets.

## Minification Boundary

`StylesheetOptions::minify` controls writer formatting only. When `minify` is true, `CssWriter` omits indentation,
newlines, and optional spaces it owns.

There is deliberately no `optimize` option. A previous raw character whitespace pass was removed because it could corrupt
valid CSS, for example descendant selectors (`.x :hover`) and quoted values (`content: "a  b"`). Any future optimizer
must parse CSS and preserve CSS semantics.

## Merged vs split output

The stylesheet has two rendering modes, both off the same encoded atoms/recipes:

- **Merged** — `compile()` → one cascade string (the common sink). It also returns `StylesheetLayerRanges` (UTF-8 **byte**
  offsets into `css`, one per layer). `StylesheetOutput::get_layer_css(&[StylesheetLayer])` slices those ranges **in
  Rust** — JS must not slice the byte offsets (it counts UTF-16 units; non-ASCII CSS would corrupt). The binding exposes
  this as `compiler.layerCss(layers)` for `cssgen <type>` / `--minimal` (a merged subset string).
- **Split** — `split_css()` → `Vec<SplitCssFile { path, code }>`, the `--splitting` file set: one file per non-recipe
  layer (`reset.css`/`global.css`/`tokens.css`/`utilities.css`), one per recipe (`recipes/<name>.css`), and the
  `recipes.css` / `styles.css` index files. The host writes each `path → code` — the same model as a codegen artifact,
  not a CSS string. Themes will slot in as more `SplitCssFile`s when per-theme emission lands.

The recipes layer is why split is a **separate emit pass, not a slice** of the merged output: `compile()` writes all
recipes into one `@layer recipes {…}` block, while `emit_recipe_split()` regroups the base+variant groups by recipe name
(first-seen) and re-emits each as its own `@layer recipes {…}` block. The two are CSS-equivalent (browsers merge
same-named layers) but byte-different, so `compile()` stays the canonical merged renderer and `split_css` owns the
multi-file form. Only the five layers are isolable; `keyframes`/`static` share a layer and would need their own
sub-ranges to split (deferred).

## Related

- [Compiler lifecycle](./compiler-lifecycle.md)
- [Atomic encoding](./atomic-encoding.md)
- [Crate layering](./crate-layering.md)
- [Scope and boundaries](./scope-and-boundaries.md)
