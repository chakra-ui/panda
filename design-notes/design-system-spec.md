# Design system spec document

## Summary

`styled-system/specs/*.json` and `styled-system/themes/*.json` are how tooling outside the compiler reads a design
system — token viewers, docs builds, dashboards, `panda analyze` reports. Today those artifacts are lossy projections:
`specs.rs` resolves every token reference to a literal before writing, and the themes artifact ships CSS text rather
than data. Both destroy structure the engine already has, so every consumer reconstructs it by parsing strings.

This note describes `specs/design-system.json`, one normalized document keyed like a small relational database: a
`tokens` table keyed by path, a flat `values` table keyed by `(token, condition, theme)`, and `conditions` / `themes`
definition tables the other two point at. The generated `themes/` runtime keeps shipping CSS — that is the correct fast
path for `injectTheme` — and gains nothing heavier than a list of theme names.

The spec is **not** part of `panda codegen` output. Measured against the rest of codegen, by semantic-token count:

```
semantic tokens   codegen    spec    spec share
      0            1.42ms   0.00ms       0%
    200            1.40ms   1.39ms      50%
    800            4.40ms   4.91ms      53%
   2000           13.99ms  12.70ms      48%
```

Roughly half of codegen, for a document nothing in the build reads. `--spec` asks for it (`panda codegen --spec`,
`panda build --spec`, `panda lib --spec`). In the graph `ArtifactId::Specs` answers `is_styled_system()` with `false`,
so `generate_all` and `affected` skip it and only `node(Specs)` reaches it.

## What the artifacts lose today

`specs/tokens.json` and `specs/semantic-tokens.json` are two denormalized projections of one table, split only because
one has a condition. Their element shapes disagree as a result: a plain token carries `value: string`, a semantic token
carries `values: { condition, value }[]`.

`resolve_value()` in `crates/pandacss_codegen/src/artifacts/specs.rs` walks `var(--x)` chains up to 32 times and writes
the literal it lands on. Across every generated artifact in `sandbox/`, **zero `var()` references survive**. A semantic
token authored as `{colors.red.600}` arrives as `#dc2626` with no record that the edge existed.

The same information survives one directory over, in a form nobody can query:

```
themes/theme-primary.json  →  { name, id, css }

[data-panda-theme=primary] {
  --colors-text: red;
  --colors-muted: var(--colors-red-200);   ← the reference is right here
}
```

So the reference graph is preserved in the CSS blob, where recovering it means parsing CSS, and discarded from the JSON,
where it would be a field. `apps/studio` pays for this directly: `utils/token-model.ts` runs regexes over CSS selectors
to rediscover which themes exist and what they override.

That graph is not incidental. "Which primitives does this semantic token resolve through", "what breaks if I change
`red.200`", "which tokens does nothing reference" are the questions a design-system tool exists to answer, and none are
answerable from today's output.

## The model is already relational

`pandacss_tokens::Token` is a row:

- `path` — primary key.
- `var` — second unique key (`var(--colors-red-500)`).
- `value` — the resolved value.
- `original_value` — pre-alias value. **The pointer, already retained on the row.**
- `category` — foreign key → category.
- `condition` — foreign key → condition, nullable.
- `description`, `deprecated`, `deprecated_reason` — metadata, none of which reached the artifact before.

`condition` being nullable is the whole design. A semantic token is not a different entity; it is rows sharing a `path`
with different `condition` values, which is why `token_with_condition(path, condition)` is a composite-key lookup.

Themes are the same story. `ThemeVariant { tokens, semantic_tokens }` is a set of overrides — a third dimension on the
same table, not a separate concept. Tokens, semantic tokens and themes are one table with two nullable columns.

## The document

One file, top-level keys as tables.

```jsonc
{
  "schemaVersion": 1,

  // [from, to) ranges into `paths` — render a category by slicing, no grouping pass.
  "categories": { "colors": [0, 3], "spacing": [3, 5] },

  // Every token path, grouped by category, dictionary order within it.
  "paths": ["colors.red.500", "colors.blue.600", "colors.fg", "spacing.4", "spacing.-4"],

  // Keyed by path: O(1) lookup with no index to build.
  "tokens": {
    "colors.fg": { "category": "colors", "cssVar": "--colors-fg", "semantic": true },
    "spacing.-4": { "category": "spacing", "description": "one rem" }, // derived: no variable
  },

  // Keyed by the `_`-prefixed name value rows carry, so the join works.
  "conditions": { "_dark": "[data-theme=dark] &" },
  "themes": { "brand": { "id": "panda-theme-brand", "selector": "[data-panda-theme=brand]" } },

  // Composite key (token, theme, condition); absent means base.
  "values": [
    { "token": "colors.fg", "value": "#ef4444", "refs": ["colors.red.500"] },
    { "token": "colors.fg", "condition": "_dark", "value": "#2563eb", "refs": ["colors.blue.600"] },
    { "token": "colors.fg", "theme": "brand", "value": "#2563eb", "refs": ["colors.blue.600"] },
  ],
}
```

Token metadata also includes optional `originalValue`, copied from the base dictionary token's `original_value`.
It preserves the value before reference expansion or derivation and is omitted when the dictionary retains none.
This additive field keeps schema version 1; condition and theme values remain in the `values` table.

Two decisions worth stating outright.

**Ship `value` and `refs` together.** Pointers alone would push resolution onto every consumer, cycle handling included
— and the 32-iteration guard in `resolve_value` says cycles are real. Resolving once in Rust and shipping the answer
_beside_ the edges is the read-optimized column next to the normalized one, not redundancy. `refs` is a list because one
value can touch several tokens (`color-mix(in srgb, {colors.a}, {colors.b})`).

**One file, not one file per table.** The obvious reading of "JSON as tables" is several files, and it is worse here for
two concrete reasons. `apps/studio`'s input model is _drag a folder in_, so multiple files means partial drops and no
way to tell whether they came from the same build. And any browser consumer pays a round trip per table. A single
document with keyed collections gives every normalization benefit with no split-brain. Split a table out later only if
one grows big enough to lazy-load: the default preset is 513 tokens / 46 KB today, nowhere near that.

## Where the tokens come from

The emitter reads one input: `config.token_dictionary()`, built from the **resolved** config. Everything that reaches
the resolved config therefore reaches the document, through one mechanism rather than several special cases:

- Config-authored `theme.tokens` and `theme.semanticTokens`.
- **Presets.** Merged into the config before the engine builds the dictionary, so preset tokens are indistinguishable
  from config-authored ones by the time codegen runs.
- **`designSystem` packages.** The manifest points at a compiled preset that carries token definitions (see
  [design-system-manifest](./design-system-manifest.md)), so a design system's tokens arrive by the preset path too.
- **Themes.** `config.themes` supplies the theme table, and theme overrides sit in the dictionary as `_theme*`
  conditions. The emitter splits `_themeBrand:_dark` into `theme: "brand"` + `condition: "_dark"` so readers never parse
  condition strings.
- **Derived tokens.** Negative spacing and friends appear as ordinary rows whose `refs` point back at the token they are
  derived from.

Two things it deliberately does not cover:

- **Build-info-only consumption.** `pandacss_project::build_info` never touches the token dictionary — hydrating a
  design system's build info brings atoms and token identity for re-emission, not dictionary entries. An app that
  consumes a design system purely through build info, without installing its preset, gets a document describing its own
  resolved system and not the library's. That is the intended reading: the document describes _this_ project.
- **`CodegenOverlay`.** It carries module wiring (jsx/recipes/patterns/css/helpers and `virtualize_*`), no tokens, so
  there is nothing token-shaped for the emitter to miss. An app that virtualizes a design system's `styled-system` still
  emits its own document for its own resolved config.

`colorPalette` entries are excluded, matching `specs/tokens.json`.

Conditions arrive the same way. `_osDark` and friends are defined in `preset-base`, not hardcoded in the engine, so they
merge into `config.conditions` like any other preset field: a real project resolves 116 of them and every `condition` a
value row carries has a definition to join to.

## Themes API

The generated `themes/index.js` currently exports exactly two functions:

```js
getTheme(name) // dynamic import → { id, name, css }
injectTheme(el, theme) // <style> with theme.css, sets el.dataset.pandaTheme
```

There is no query surface at all. You cannot ask what a theme overrides without parsing its CSS.

**Keep both functions exactly as they are.** They are the runtime path, they ship into user bundles, and a CSS string is
the right payload for injecting a stylesheet. Query helpers do not belong there — tooling that wants to interrogate a
theme is not in the hot path, and every byte added to `themes/` is paid by every app.

Two changes instead:

1. **Theme data moves into the spec document** as `themes` + `values` rows carrying `theme`. Tooling reads one file; the
   runtime keeps reading CSS.
2. **Add `export const themeNames = [...]` to the generated runtime.** `ThemeName` is a type-only union today, so an app
   building a theme switcher has to hardcode the list it already generated. This is a few bytes and removes the only
   genuine gap in the runtime API.

## Indexing

Normalized data means every consumer writes `new Map(values.map(v => [v.token, v]))`. `introspect(spec)` in
`@pandacss/compiler-shared` already exists for exactly this reason — "index the spec once, query hot" — and
`indexDesignSystem` follows it:

```ts
const ds = indexDesignSystem(parseDesignSystem(raw).value)

ds.categoryPaths('colors') // a slice of `paths`; no index built
ds.token('colors.muted') // keyed lookup; no index built
ds.valuesFor('colors.muted') // every condition/theme variant
ds.resolve('colors.muted', { condition: '_osDark', theme: 'primary' })
ds.referencesTo('colors.red.200') // reverse edge — the graph query
ds.unreferenced('colors') // dead-token audit
```

The split matters: the first two read the keyed table and the precomputed ranges directly, so a viewer that only renders
never builds an index. The rest need one over `values`, so it is built on first use and reused after.

These live beside `parseTokenSpec` in `compiler-shared`, not in generated output.

## Replacing `specs/tokens.json` and `specs/semantic-tokens.json`

Both are gone. Before removing them, both were rebuilt from the document on real `preset-panda` output: 513 of 513 token
entries reconstructed with zero value mismatches, and semantic tokens matched once theme rows were folded back into
`_theme*` conditions. Ordering matched too — `paths` follows the dictionary, the order `tokens.json` used.

The reverse never held. The old pair resolved every `var()` away, folded theme overrides into condition names, and
carried no `cssVar`, `description` or `deprecated`. The pair could be derived from the document and not the other way
round, which is what made dropping them safe rather than lossy.

## Measured

Three shapes were compared before picking this one, generating systems from 500 to 115,000 tokens.

- **Grouping `values` by path** is 10% smaller but 1.8x slower to parse and index at 115k tokens (311 ms vs 169 ms).
  Many small keyed arrays cost more in V8 than one large flat array. Rejected.
- **Shipping precomputed indexes in the document** costs 45% more gzip and saves nothing: parse grows by exactly what
  index-building saved (171 ms vs 169 ms). Rejected.
- **Baking render order in** (`paths` + `categories` ranges) costs ~16% more gzip and pays back 33% of
  time-to-first-paint at every size, because the viewer never groups tokens by category. Kept.

The shipped implementation, measured through `parseDesignSystem` + `indexDesignSystem`:

- Real `preset-panda` (516 tokens, 519 rows): **0.35 ms** to parse, index and render the colors category.
- 28,750 tokens / 33,250 rows: 15.5 ms parse, **16.5 ms** to first paint, 20.2 ms once a graph query forces the lazy
  index. Token lookup 0.04 µs, `resolve` 0.23 µs, `referencesTo` 0.04 µs.
- 115,000 tokens / 133,000 rows (past any real system): 78 ms to first paint, 104 ms with the graph index.

The lazy index is what keeps those apart: presentation reads never build it, so a viewer that only renders pays parse
cost and nothing else.

## Migration

1. ~~Emit `specs/design-system.json`.~~ Done; it is now the only file the Specs artifact writes.
2. ~~Add `parseDesignSystem` + types to `compiler-shared`.~~ Done.
3. ~~Add `indexDesignSystem`.~~ Done, including the presentation surface (`name`, `view`, `variants`).
4. ~~Move `apps/studio` onto it.~~ Done — the acceptance test below.
5. Add `themeNames` to the generated themes runtime.
6. Update docs that still describe `specs/tokens.json`.

### What the studio migration deleted

The test of the schema was whether the studio's hand-rolled parsing tier could go. It did:

- `utils/tokens.ts` — the zod schema describing Panda's own artifact.
- `utils/panda-dict.ts` — a brace matcher scraping `const tokens = {…}` out of generated JavaScript.
- `utils/token-css.ts` — brace matching `@layer tokens` out of a CSS string.
- `utils/token-model.ts` — regex over CSS selectors to rediscover themes, plus a synthesized dark layer.
- `server/utils/sanitize-css.ts`, the `css` column, and the CSS slot in IndexedDB.

What replaced them is `utils/design-system.ts`: a parse wrapper, a variant labeller, and the renderer/sort taxonomy that
is genuinely the studio's own. Theme switching went from injecting a stylesheet and toggling selectors to
`ds.view(category, variant)` returning resolved literals, verified in a browser: selecting a theme repaints every swatch
with no CSS involved.

One thing did not delete. `rendererFor` and `toNumber` — which view to draw per category, and numeric ordering for
scales — are presentation decisions, not system ones, and stayed in the app.

## Unresolved Questions

- **Does `CodegenArtifactId` cover this?** The TS union lists 13 ids against `ArtifactId`'s 24 in Rust, `Specs` among
  the missing. Worth answering before adding a 25th.
- **Recipes and patterns.** Also design-system data tooling cannot read. Out of scope here, but the document is named
  and versioned so they can become tables later rather than a fourth artifact family.

## Related

- [Build info](./build-info.md) — the other portable document a design system ships; owns token identity and hydration.
- [Codegen design](./codegen-design.md) — artifact graph and dependency tracking.
- [Token reference syntax](./token-reference-syntax.md) — the `{colors.red.500}` authoring form these refs come from.
- [Container query theme API](./container-query-theme-api.md) — another theme-adjacent config surface.
