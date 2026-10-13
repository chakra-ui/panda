<!-- Tracks: chakra-ui/panda#3508, #3510 (matchTag control), #3522 item 12 (scope note). -->
<!-- Implemented in chakra-ui/panda#3989. -->

# JSX Tag Matching (`jsxMatchTag`)

## Summary

`jsxMatchTag` is the declarative, data-only successor to v1's `matchTag` / `matchTagMode` / `matchTagProp` parser hooks.
It lets a user control **which JSX tags Panda extracts style props from**, **which props** count, and **which tags to
ignore outright** — matched by component name, name pattern, or **import source**. It is a list of plain rules (no
functions), so it serializes into the config snapshot and is evaluated natively in Rust. This is the only way the
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
Rust-evaluated _filters_ (serialized data), not callback refs.

## The motivating cases (from the issues)

- **#3508 / #3510 — Chakra → Panda migration.** Component names collide (`Stack`, `Box`); Panda misreads third-party
  `@chakra-ui/react` components as its own and emits junk CSS. The reporter needed to discriminate **by import source**
  ("imported from Panda `outDir` or another library") and to **fully override** Panda's verdict. → drives the `from`
  field and the `ignore` action.
- **Pattern-named components.** Teams want `MyButton`, `BrandButton` picked up without enumerating each. → drives
  `RegExp` `tag` matching.
- **v1 `matchTagProp`.** Per-component control of which props are style props. → folded in as the per-rule `props`.

## API

A single ordered rule list; ignore is a per-rule flag, not a second config key.

```ts
// panda.config.ts
jsxMatchTag: [
  { from: '@acme/ui' }, // every component imported from @acme/ui
  { tag: /Button$/ }, // match by name pattern
  { from: '~/components', tag: 'Box' }, // scoped: Box, only from this module
  { tag: 'Card', props: ['padding', 'color'] }, // match, extract ONLY these style props
  { tag: 'Stack', ignore: true }, // never extract (beats Panda's own detection)
  { from: '@chakra-ui/react', ignore: true }, // ignore an entire package (the #3508 case)
]
```

Rule fields — `string` = exact, `RegExp` = pattern; all JSON-serializable:

- `from` — import specifier the local binding was imported from.
- `tag` — local JSX name as used in source.
- `props` — extract only these style props.
- `ignore: true` — exclude the tag entirely.

A rule must carry at least `from` or `tag`, and can't set both `props` and `ignore` (config errors otherwise).

`ignoreProps` from the first draft was dropped. Data props that aren't styles are already skipped on components Panda
doesn't own, and `ignore` covers whole third-party components. Add it if a real case needs it.

### Semantics

- **Baseline + cascade.** JSX style-prop extraction is opt-in via `jsxFramework`. Without it, JSX tags never produce
  style usages, even when they are imported from Panda JSX modules or matched by configured component names. This
  matches v1, where the JSX parser callbacks were not enabled without a framework. When `jsxFramework` is configured,
  Panda's own detection becomes the baseline: importMap components plus the implicit "any uppercase component"
  heuristic. User rules cascade on top of that baseline. For a given tag the **last matching rule wins** (`ignore` or
  include) — the `.gitignore` / ESLint / CSS-source-order model. Chosen over "ignore-always-wins" because it preserves
  v1's expressive power (ignore a whole package but re-include one component) without losing local readability, and over
  a specificity model because computed specificity is a known source of confusion. Convention: **order general rules
  first, specific refinements after**.
- **Override.** Because user rules sit above the baseline, an `ignore` rule turns off a Panda-detected component (v1's
  `matchTagMode: 'override'`); a later include can turn it back on.
- **Props come from the winning rule only.** `props` filters what Panda's own prop matching already extracted, so
  `jsxStyleProps` and recipe/pattern props still apply first. Without `props`, nothing changes.
- **`from` matches the literal import specifier** as written in the source — no barrel/re-export resolution (that needs
  module-graph walking, which the hot path avoids). Match the package/alias you import from; use a `RegExp` for subpaths
  (`/^~\/components/`). Relative specifiers (`./button`) are position-dependent — prefer `tag` or an alias.
- **Preset merge.** `jsxMatchTag` is a top-level key, so like every other top-level key the last config that sets it
  replaces the list. A preset's rules don't carry into an app that sets its own.
- Local, non-imported uppercase tags keep the native default (`is_uppercase_component_tag`) only after `jsxFramework`
  enables JSX extraction, unless a later `ignore` rule removes them.

This one surface replaces all three v1 knobs: `matchTag` (include by name), `matchTagMode: 'override'` (`ignore`), and
`matchTagProp` (`props`).

## Migration from v1

In v1 these lived as functions under `hooks['parser:before'].configure(...)`. In v2 they move to a top-level, data-only
`jsxMatchTag` config key. The translation is mechanical for everything that wasn't genuinely dynamic.

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
// v2 — allowlist
jsxMatchTag: [{ tag: 'Button', props: ['variant', 'size'] }]
```

**Mechanical checklist:**

- Move the config out of `hooks['parser:before'].configure(...)` to the top-level `jsxMatchTag` key.
- `matchTag` returning `true` for a tag/pattern → an include rule (`{ tag }` or `{ from }`).
- `matchTagMode: 'override'` excluding a tag → an `{ ignore: true }` rule (no global mode switch in v2).
- `matchTagProp` allowing a subset → `props`. Denying a subset → list the props you keep in `props`.
- Logic keyed on _where a component came from_ → `from` (previously only possible via a custom import-parsing plugin).

**No v2 equivalent (by design):** a v1 `matchTag`/`matchTagProp` that ran _genuinely dynamic_ logic which can't be
reduced to a name, pattern, or import source (e.g. reading file contents, external state, per-render conditions). This
is intentional — see [Why declarative, not a callback](#why-declarative-not-a-callback). In practice these reduce to
patterns; if a real case can't, it's an issue to open, not a callback to reintroduce.

## Internal design

```
config snapshot ──► pandacss_config::JsxMatchTagRule      (tag/from reuse JsxSpecifier = string | SerializedRegex)
                          │ pandacss_system::config::jsx_tag_rules — validate, compile regexes once
                          ▼
                    JsxExtractionConfig.tag_rules: Vec<JsxTagRule>
                          │
extract(file) ──► detect tag (Panda import / configured component / uppercase heuristic)
                          │
                          ▼
                    tag_rule(tag, from) = rules.iter().rev().find(matches)
                       ├─ Ignore         → not extracted (even Panda imports)
                       ├─ Include(props) → extracted; `props` filters the style tree
                       └─ no rule        → detection unchanged
```

- One decision point per tag-resolution path: `Extractor::resolve_tag` (JSX elements and member tags),
  `resolve_runtime_tag` (compiled `jsx()` calls), and `apply_template_tag_rule` (Vue/Svelte/Astro templates).
- `from` reads a per-file map from local binding to import path, built from the import scan every file already runs.
  It's built only when some rule uses `from`; member tags (`UI.Card`) use the root binding.
- Rule lists are tiny, so a reverse linear scan per tag needs no cache or `RegexSet`.
- `props` runs after Panda's prop matching, through `retain_style_tree_props`, instead of threading a new argument
  through every `should_extract_prop` call.
- An empty `jsxMatchTag` isn't serialized, so existing config fingerprints (and published build info) don't change.

## Interaction with local `styled()` chains

A module-level `const Button = styled('button', …)` resolves as `<styled.button>` **before** any `jsxMatchTag` rule is
consulted, so the chain fold reaches it. When `ignore: true` lands it has to gate that branch too, or
`{ tag: 'Button', ignore: true }` is silently overridden for a local chain. The fold already requires the tag to resolve
to the symbol the chain declared, so the hook point exists.

## Out of scope

**Recipe variant tree-shaking through wrapper components** (#3522 item 12). When `MyRedButton = (p) => <Button {...p}/>`
forwards props to a recipe component, a variant value used at `<MyRedButton size="lg">` must be attributed back to
`buttonRecipe` for the right CSS to be emitted. `jsxMatchTag` does **not** solve this: matching the tag name does not
connect `MyRedButton`'s `size` prop to `buttonRecipe`'s `size` variant. That is a separate data-flow problem (bounded
forwarding analysis + a pregenerate fallback, where the invariant is _never silently miss a variant_) and deserves its
own design note. `jsxMatchTag` is necessary-but-not-sufficient for it.

## Decisions

Resolved after review (was: Unresolved Questions):

- **Precedence → last-match-wins** over a baseline of Panda's own detection. Beats "ignore-always-wins" (can't express
  package-except-component) and specificity (confusing). See [Semantics](#semantics).
- **Multiple matching include rules → the winning (last) rule supplies the full prop config**; no union/merge.
- **`from` → matches the literal import specifier as written**; no barrel/re-export resolution. Regex for subpaths;
  relative specifiers discouraged.
- **Config shape → flat `jsxMatchTag`.** A `jsx` namespace, if ever wanted, is a separate codemod-backed migration of
  _all_ jsx options at once — never piecemeal.

## Unresolved Questions

- **Relative-`from` ergonomics.** Matching `./button`-style specifiers is position-dependent; we may add optional
  normalization (resolve to project-relative) later if demand appears. For now the guidance is regex/alias/`tag`.
- **Phase 2 integration point** — the exact place `from` rules hook into import resolution; settled by the spike.

## Related

- [Hooks](./hooks.md) — boundary-cost taxonomy; why `parser:before` filters (and this) are serialized data, not
  callbacks.
- [Extraction pipeline](./extraction-pipeline.md) — where tag classification happens.
- [Cross-file resolution](./cross-file-resolution.md) — import resolution that Phase 2 `from` matching hooks into.
- [Chakra UI as a Panda v2 Design System](./chakra-ui-design-system-migration.md) — the migration that motivates `from`.
