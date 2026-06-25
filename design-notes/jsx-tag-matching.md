<!-- Tracks: chakra-ui/panda#3508, #3510 (matchTag control), #3522 item 12 (scope note). -->
<!-- Link the implementing PR here when it lands. -->

# JSX Tag Matching (`jsxMatchTag`)

## Summary

`jsxMatchTag` is the declarative, data-only successor to v1's `matchTag` / `matchTagMode` / `matchTagProp` parser
hooks. It lets a user control **which JSX tags Panda extracts style props from**, **which props** count, and **which
tags to ignore outright** — matched by component name, name pattern, or **import source**. It is a list of plain rules
(no functions), so it serializes into the config snapshot and is evaluated natively in Rust. This is the only way the
feature can exist in v2: extraction runs in the Rust/Oxc engine and in the browser wasm build, where a per-element JS
callback across the NAPI/wasm boundary is not an option (see [Hooks](./hooks.md) on the boundary-cost taxonomy).

This note covers **Problem A only** — tag/prop matching for extraction. It explicitly does **not** cover recipe variant
tree-shaking through wrapper components (#3522 item 12); see [Out of scope](#out-of-scope).

## Why declarative, not a callback

v1 exposed `matchTag(tag, isPandaComponent) => boolean` (+ `matchTagMode`) and `matchTagProp(tag, prop) => boolean` via
`hooks['parser:before'].configure(...)`. That worked because v1 extraction was JS (ts-morph). In v2 it can't be a
function:

- The resolved config crosses into the engine as a **serialized snapshot** (`createConfigSnapshot` → plain data). A JS
  closure can't ride in it.
- The same config must drive `@pandacss/compiler-wasm` in the browser, where there is no NAPI threadsafe-function to
  call back through, and the Rust scan is parallel.
- Even a memoized callback (resolve once per distinct tag) still requires holding a live JS function in Rust — same
  violation, just cheaper.

So the import-source context users actually need becomes a **field** (`from`) in a declarative rule, not an argument to
a function. This matches the v2 hook philosophy: the one per-file hot-path hook (`parser:before`) already uses
Rust-evaluated *filters* (serialized data), not callback refs.

## The motivating cases (from the issues)

- **#3508 / #3510 — Chakra → Panda migration.** Component names collide (`Stack`, `Box`); Panda misreads third-party
  `@chakra-ui/react` components as its own and emits junk CSS. The reporter needed to discriminate **by import source**
  ("imported from Panda `outDir` or another library") and to **fully override** Panda's verdict. → drives the `from`
  field and the `ignore` action.
- **Pattern-named components.** Teams want `MyButton`, `BrandButton` picked up without enumerating each. → drives
  `RegExp` `tag` matching.
- **v1 `matchTagProp`.** Per-component control of which props are style props. → folded in as the per-rule `props` /
  `ignoreProps`.

## API

A single ordered rule list; ignore is a per-rule flag, not a second config key.

```ts
// panda.config.ts
jsxMatchTag: [
  { from: '@acme/ui' },                           // every component imported from @acme/ui
  { tag: /Button$/ },                             // match by name pattern
  { from: '~/components', tag: 'Box' },           // scoped: Box, only from this module
  { tag: 'Card', props: ['variant', 'size'] },    // match, extract ONLY these props (strict)
  { tag: 'Avatar', ignoreProps: ['src', 'alt'] }, // match, all style props EXCEPT these
  { tag: 'Stack', ignore: true },                 // never extract (beats Panda's own detection)
  { from: '@chakra-ui/react', ignore: true },     // ignore an entire package (the #3508 case)
]
```

Rule fields — `string` = exact, `RegExp` = pattern; all JSON-serializable:

- `from` — import specifier the local binding was imported from.
- `tag` — local JSX name as used in source.
- `props` — allowlist of props to extract; **presence implies strict** (only these are extracted).
- `ignoreProps` — props never extracted from this match.
- `ignore: true` — exclude the tag entirely.

A rule must carry at least `from` or `tag` (config-validation error otherwise).

### Semantics

- **Baseline + cascade.** JSX style-prop extraction is opt-in via `jsxFramework`. Without it, JSX tags never produce
  style usages, even when they are imported from Panda JSX modules or matched by configured component names. This
  matches v1, where the JSX parser callbacks were not enabled without a framework. When `jsxFramework` is configured,
  Panda's own detection becomes the baseline: importMap components plus the implicit "any uppercase component"
  heuristic. User rules cascade on top of that baseline. For a given tag the **last matching rule wins** (`ignore` or
  include) — the `.gitignore` / ESLint /
  CSS-source-order model. Chosen over "ignore-always-wins" because it preserves v1's expressive power (ignore a whole
  package but re-include one component) without losing local readability, and over a specificity model because
  computed specificity is a known source of confusion. Convention: **order general rules first, specific refinements
  after**.
- **Override.** Because user rules sit above the baseline, an `ignore` rule turns off a Panda-detected component
  (v1's `matchTagMode: 'override'`); a later include can turn it back on.
- **Props come from the winning rule only.** The last matching include rule supplies the full prop config
  (`props` / `ignoreProps`); configs are **not** merged across rules. Absent prop fields fall back to the global
  `jsxStyleProps` mode; `props` present ⇒ strict (only those).
- **`from` matches the literal import specifier** as written in the source — no barrel/re-export resolution (that needs
  module-graph walking, which the hot path avoids). Match the package/alias you import from; use a `RegExp` for
  subpaths (`/^~\/components/`). Relative specifiers (`./button`) are position-dependent — prefer `tag` or an alias.
- **Preset merge.** Rules concatenate in config-resolution order with the app's rules last, so an app naturally
  overrides preset-contributed rules — consistent with last-match-wins.
- Local, non-imported uppercase tags keep the native default (`is_uppercase_component_tag`) only after
  `jsxFramework` enables JSX extraction, unless a later `ignore` rule removes them.

This one surface replaces all three v1 knobs: `matchTag` (include by name), `matchTagMode: 'override'` (`ignore`), and
`matchTagProp` (`props` / `ignoreProps`).

## Migration from v1

In v1 these lived as functions under `hooks['parser:before'].configure(...)`. In v2 they move to a top-level,
data-only `jsxMatchTag` config key. The translation is mechanical for everything that wasn't genuinely dynamic.

**`matchTag` (extend mode — match extra components by name/pattern):**

```ts
// v1
hooks: {
  'parser:before'({ configure }) {
    configure({ matchTag: (tag) => tag.startsWith('My') })
  },
}
// v2
jsxMatchTag: [{ tag: /^My/ }]
```

**`matchTagMode: 'override'` (drop specific Panda components):**

```ts
// v1 — "all Panda components except Stack"
configure({ matchTagMode: 'override', matchTag: (tag, isPanda) => isPanda && tag !== 'Stack' })
// v2 — baseline detection stays; just remove Stack
jsxMatchTag: [{ tag: 'Stack', ignore: true }]
```

**Ignore by import source (#3508 — the Chakra-collision case that needed a hand-written import-parsing plugin):**

```ts
// v1 — custom plugin inspecting each file's imports to reject non-Panda Stacks/Boxes
// v2 — one rule
jsxMatchTag: [{ from: '@chakra-ui/react', ignore: true }]
```

**`matchTagProp` (which props are style props on a tag):**

```ts
// v1 — Button only extracts variant/size
configure({ matchTagProp: (tag, prop) => tag === 'Button' && ['variant', 'size'].includes(prop) })
// v2 — strict allowlist
jsxMatchTag: [{ tag: 'Button', props: ['variant', 'size'] }]

// v1 — Button extracts everything except src/alt
configure({ matchTagProp: (tag, prop) => tag !== 'Button' || !['src', 'alt'].includes(prop) })
// v2
jsxMatchTag: [{ tag: 'Button', ignoreProps: ['src', 'alt'] }]
```

**Mechanical checklist:**

- Move the config out of `hooks['parser:before'].configure(...)` to the top-level `jsxMatchTag` key.
- `matchTag` returning `true` for a tag/pattern → an include rule (`{ tag }` or `{ from }`).
- `matchTagMode: 'override'` excluding a tag → an `{ ignore: true }` rule (no global mode switch in v2).
- `matchTagProp` allowing a subset → `props`; denying a subset → `ignoreProps`.
- Logic keyed on *where a component came from* → `from` (previously only possible via a custom import-parsing plugin).

**No v2 equivalent (by design):** a v1 `matchTag`/`matchTagProp` that ran *genuinely dynamic* logic which can't be
reduced to a name, pattern, or import source (e.g. reading file contents, external state, per-render conditions). This
is intentional — see [Why declarative, not a callback](#why-declarative-not-a-callback). In practice these reduce to
patterns; if a real case can't, it's an issue to open, not a callback to reintroduce.

## Internal design

Because precedence is last-match-wins (not set membership), user rules compile into an **ordered** `Vec<CompiledRule>`
evaluated as a cascade: `classify(tag, specifier)` scans rules, the last match decides include-vs-ignore and carries
that rule's prop config. This sits *above* Panda's existing baseline detection rather than replacing it — the scan is
cheap (few rules, memoized per distinct `(tag, specifier)`, resolved per import binding not per element). The prop
dimensions still reuse the existing `JsxExtractionConfig` concepts:

| Rule piece            | Maps to (existing unless noted)                               |
| --------------------- | ------------------------------------------------------------- |
| include `tag`         | `component_names` / `component_regexes`                       |
| `props`               | `component_props` / `component_regex_props` + `component_strict` |
| `ignoreProps`         | `component_blocklist` / `component_regex_blocklist`           |
| `ignore` (tag)        | **new** `tag_blocklist` / `tag_regex_blocklist`              |
| `from` (include/ignore) | resolved at import time (see Phase 2)                       |

The bridge (`pandacss_project::config::jsx_extraction_config_from_definitions`) builds these from `config.jsxMatchTag`,
reusing the existing `collect_jsx_strings` / `jsx_regexes` string-vs-regex helpers, then `.with_regex_sets()`.

The only genuinely new field is a **tag blocklist**: `tag_blocklist: FxHashSet<String>` + `tag_regex_blocklist` +
its `RegexSet`, with an `is_tag_blocklisted()` checked in `should_match_tag` **and** at the `is_component_tag` call
sites in `jsx.rs` (so ignore beats configured patterns/recipes like `Stack`).

### Phasing

- **Phase 1 — name/pattern matching + `ignore` + `props`/`ignoreProps`.** Almost entirely wiring existing fields; adds
  only the tag blocklist. No FFI, no import resolution.
- **Phase 2 — `from` (import-source) matching.** The load-bearing piece for #3508. A `from` rule can't be decided from
  the tag name; it needs the per-file import bindings, resolved at the **import-resolution stage** where Panda already
  classifies its own imports (`match_imports`): for each `(localName, specifier)`, evaluate `from`/`tag` rules → add
  `localName` to that file's matched set, or to a per-file ignore set (ignore wins). Phase 2 is **not optional** — the
  primary migration case needs it — but it is sequenced after Phase 1.

**Spike before Phase 2:** confirm exactly how v2 marks "imported-from-Panda" components per file relative to the global
`JsxExtractionConfig`, so `from` rules slot into the same path rather than a parallel one
(see [Extraction pipeline](./extraction-pipeline.md), [Cross-file resolution](./cross-file-resolution.md)).

## Out of scope

**Recipe variant tree-shaking through wrapper components** (#3522 item 12). When `MyRedButton = (p) => <Button {...p}/>`
forwards props to a recipe component, a variant value used at `<MyRedButton size="lg">` must be attributed back to
`buttonRecipe` for the right CSS to be emitted. `jsxMatchTag` does **not** solve this: matching the tag name does not
connect `MyRedButton`'s `size` prop to `buttonRecipe`'s `size` variant. That is a separate data-flow problem (bounded
forwarding analysis + a pregenerate fallback, where the invariant is *never silently miss a variant*) and deserves its
own design note. `jsxMatchTag` is necessary-but-not-sufficient for it.

## Decisions

Resolved after review (was: Unresolved Questions):

- **Precedence → last-match-wins** over a baseline of Panda's own detection. Beats "ignore-always-wins" (can't express
  package-except-component) and specificity (confusing). See [Semantics](#semantics).
- **Multiple matching include rules → the winning (last) rule supplies the full prop config**; no union/merge.
- **`from` → matches the literal import specifier as written**; no barrel/re-export resolution. Regex for subpaths;
  relative specifiers discouraged.
- **Config shape → flat `jsxMatchTag`.** A `jsx` namespace, if ever wanted, is a separate codemod-backed migration of
  *all* jsx options at once — never piecemeal.

## Unresolved Questions

- **Relative-`from` ergonomics.** Matching `./button`-style specifiers is position-dependent; we may add optional
  normalization (resolve to project-relative) later if demand appears. For now the guidance is regex/alias/`tag`.
- **Phase 2 integration point** — the exact place `from` rules hook into import resolution; settled by the spike.

## Related

- [Hooks](./hooks.md) — boundary-cost taxonomy; why `parser:before` filters (and this) are serialized data, not callbacks.
- [Extraction pipeline](./extraction-pipeline.md) — where tag classification happens.
- [Cross-file resolution](./cross-file-resolution.md) — import resolution that Phase 2 `from` matching hooks into.
- [Chakra UI as a Panda v2 Design System](./chakra-ui-design-system-migration.md) — the migration that motivates `from`.
