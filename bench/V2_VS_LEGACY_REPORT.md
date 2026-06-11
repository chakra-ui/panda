# Panda v2 (Rust/Oxc) vs Legacy (ts-morph) — Comparison Report

**Date:** 2026-06-08 (deep re-review) · **Branch:** v2 · **Native artifact:** `packages/compiler/compiler.node` (rebuilt
2026-06-08)

Second deep pass comparing the v2 Rust/Oxc compiler against the legacy TypeScript (ts-morph) pipeline across
**performance**, **style output**, and **feature parity**, driven through the **v2 public API**
(`@pandacss/compiler`). Every divergence was traced to its cause and checked against the legacy/node source; three real
emitter bugs were found **and fixed this pass**. All harnesses live in `bench/__tests__/` and are reproducible:
`pnpm exec vitest run bench/__tests__/<name>.test.ts`.

---

## 1. Methodology

Two comparison surfaces, because v2 has two halves with different maturity:

- **Front-end** (config + discovery) — legacy `loadConfigAndCreateContext` vs the v2 driver `createNodeDriver`
  (`genuine.test.ts`). Loads config from disk the way the real product does. Isolates config loading, glob, presets,
  hooks.
- **Compiler/emitter** — legacy fixture `PandaContext` vs `createCompilerFromSnapshot` fed the **same resolved config**
  (`edgecases.test.ts`, `parity.test.ts`). Isolates the encoder + stylesheet from the config.

Both are real v2 entry points. The snapshot cross-feed is the only apples-to-apples *emitter* diff (v2's own
config can't yet load most real configs — see §4-A), but it has a trap: it feeds v2 the legacy **post-resolution**
config, whose `utilities.*.values` are lowered to `js-callback` refs. v2 must invoke those callbacks correctly — and two
of this pass's three bugs were exactly there (§3). CSS is normalized with `@projectwallace/format-css` before diffing.

**Harnesses:** `perf.test.ts` (timing), `edgecases.test.ts` (20-case emitter battery), `parity.test.ts` (12-sandbox e2e
sweep), `genuine.test.ts` (real v2-driver path).

---

## 2. Performance — v2 wins decisively on the hot path

Setup excluded, identical resolved config, 100-file synthetic corpus (css + cva + jsx + patterns + conditions):

- **Cold parse** (100 files, once) — legacy 177 ms → v2 7.6 ms = **~23× faster**
- **Warm re-parse** (single file, steady state) — legacy 652 µs/file → v2 1.8 µs/file = **~360× faster**
- **CSS emit** (atoms → stylesheet) — legacy 5.9 ms → v2 5.1 ms ≈ 1.15× faster

End-to-end sweep over real sandboxes corroborates: larger projects favor v2 strongly (`next-js-pages` 762→31 ms ≈
**25×**, `qwik-ts` 376→37 ms ≈ **10×**); trivial 2-file projects favor legacy purely because v2's native compiler
construction dominates when there's almost nothing to parse.

**Caveats:** (1) The warm ~360× reflects ts-morph re-parsing vs Oxc — the watch-mode hot path — and is the single
largest win. (2) v2 emit is *not* yet apples-to-apples: legacy emit runs PostCSS (merge/minify); v2 emits raw strings
with **no optimizer** (lightningcss deferred). A fair emit comparison waits for v2's optimizer.

---

## 3. Style-output parity — three emitter bugs found and fixed this pass

20-case emitter battery (`edgecases.test.ts`), clean fixture config, utilities+recipes layers. **15/20 now
byte-identical after formatting** (was 9/20 at the start of this pass). The three fixes below moved 6 cases to parity;
all three were verified against the legacy/node source before changing v2.

### Fixed

- **F1 — `theme('spacing')` in utility-values callbacks inlined raw values instead of var refs** _(High,
  fixed)_. The fixture's `marginBottom`/`width`/`inset`/`space` utilities use `values: (theme) => ({ ...theme('spacing')
  })`. v2's `getTokenCategoryValues` projected the token dictionary via `tokenDictionary.values` (raw `0.5rem`), so
  `css({ mb: '2' })` emitted `margin-bottom: 0.5rem` instead of `var(--spacing-2)` — **breaking token indirection
  (theming/dark-mode overrides) for every margin/size/inset utility in every real project**. Legacy's
  `tokens.view.getCategoryValues` stores the **varRef** (`token-dictionary/src/dictionary.ts:632`), so
  `theme('spacing')` returns `{ '2': 'var(--spacing-2)' }`. Fix: project via `tokenDictionary.vars[path] ?? values[path]`
  (`packages/compiler-shared/src/callbacks.ts:256`), matching the existing `token()` helper. `padding`
  (`values: 'spacing'`, a string category) was already correct — that asymmetry is what exposed the bug.

  ```tsx
  css({ marginBottom: '2', padding: 4 })
  // before: .mb_2 { margin-bottom: 0.5rem }      .p_4 { padding: var(--spacing-4) }   ← mb inlined
  // after:  .mb_2 { margin-bottom: var(--spacing-2) }  .p_4 { padding: var(--spacing-4) }   ✅
  ```

- **F2 — standalone `token()` call hashed the class by token path, not resolved value** _(Med, fixed)_.
  `css({ color: token('colors.red.500') })`: legacy resolves to `#ef4444` and hashes the class by the resolved value
  (`.c_\#ef4444`); the **runtime** `token()` also returns `#ef4444`, so runtime emits `class="c_#ef4444"`. v2 named the
  class by the raw token path (`.c_colors\.red\.500`) while emitting the right value — a **runtime/static class
  mismatch** (static rule never matches the runtime class). Fix: `transform_atom` hashes Token atoms by the resolved
  `value`, not `path` — `path` stays build-info-only (`crates/pandacss_stylesheet/src/emitter.rs:1599`). The
  concatenation case (`'0 0 0 1px ' + token(...)`) already matched.

- **F3 — `bgGradient` transform got the resolved value as `args.raw`, breaking the gradient machinery** _(Med, fixed;
  this was B4)_. `css({ bgGradient: 'to-r' })`: legacy builds `--gradient-stops`/`--gradient-position` and
  `background-image: linear-gradient(...)`; v2 emitted invalid `background-image: to right`. Cause: utilities with an
  inline object-map `values` (incl. resolved js-callbacks) had `to-r` substituted to `to right` **eagerly** in
  `normalize_property_value_cow`, so the transform's `args.raw` was `to right` and `isGradientShortcut(raw)` took the
  wrong branch. Legacy keeps the alias: `setStyles` calls `transform(resolvedValue, { raw: alias })`
  (`packages/core/src/utility.ts:442`). Fix: skip the eager substitution when the prop has a transform
  (`config.transform_callback_id.is_some()`) so the alias survives to the transform; the emit path resolves it
  (`crates/pandacss_utility/src/lib.rs:421`). `gradientFrom`/`gradientTo` (string-category `values`) were already
  identical. **`gradient`, `basic_tokens`, `shorthand`, `jsx_styled`, `arbitrary_selector`, `token_fn` now byte-identical.**

  Verified: `pnpm exec vitest run bench/__tests__/edgecases.test.ts` (`case_gradient.{legacy,v2}.css` identical);
  binding snapshots updated in `packages/compiler/__tests__/callbacks.test.ts` (now assert var refs, the correct
  behavior). Rust: 1164 workspace tests + 139 binding tests pass; fmt/clippy clean.

### Already at parity (byte-identical)

- ✅ Pseudo conditions (`_hover`, `_focusVisible`, nested values) · `!important` (`red.500!`, `bold !important`)
- ✅ **Recipes (`cva`)** — base, variants, **compoundVariants**, **defaultVariants**
- ✅ Patterns — `stack()`/`hstack()` calls and `<Stack>` JSX · `<styled.div>` style props
- ✅ `token('colors.red.500')` + string concatenation · color tokens (`color: 'red.500'`) · color-token var() indirection
- ✅ Conditional value maps (`{ _hover, _active, _disabled }`) · arbitrary raw values (`calc(...)`, `840px`) · negatives
- ✅ Empty `@layer compositions {}` for unknown `textStyle` is no longer emitted (B3, fixed prior pass)

Across the 12-sandbox sweep, **selector counts match within ±a few** on every project — the structural CSS is
equivalent. The remaining battery diffs are concentrated below.

---

## 4. Remaining gaps

### A. Front-end / config gaps (still blocking real-world drop-in)

- **A1 — Config-loader crashes on dynamic-import configs** _(High)_. `await import()` in a config (e.g.
  `sandbox/vite-ts`) makes Rolldown code-split; `bundle.ts` evaluates only the entry chunk via a `data:` URL, so sibling
  chunks fail: `Failed to resolve "./dist-*.js"`. Evidence: `packages/config/src/bundle.ts`. Fix: write Rolldown
  chunks to a temp dir (or `inlineDynamicImports`) instead of single-chunk `data:` URL.

- **A3 — No automatic preset injection** _(High)_. v2's loader doesn't inject `preset-base`/`preset-panda`
  (`packages/config/src/load.ts:18`, "out of scope for now"). Standard configs resolve incompletely → broken
  output: genuine `sandbox/solid-ts` still emits `color: blue .500` (unresolved token) and `bg-gradient: to-r` (raw
  utility id). This is the single biggest reason the genuine v2 path can't replace legacy on most projects, and it's
  what the snapshot cross-feed masks. Reproduce: `pnpm exec vitest run bench/__tests__/genuine.test.ts`.

- **A4 — Config hooks not executed** _(Med, by design)_. `hooks.cssgen:done` etc. don't run. `sandbox/vite-ts` uses
  `removeUnusedCssVars`; v2 ignores it → emits all token vars (24.5 KB v2 vs 10.1 KB legacy, +14 KB). Documented scope
  boundary (`packages/config/src/serialize.ts` `runtimeOnlyKeys`), but a real output delta for hook-using
  projects.

- ✅ **A2 — `./`-prefixed include globs** (fixed prior pass; `normalize_pattern` strips leading `./` in both fs walkers).
- ✅ **A5 — SFC support (Vue/Svelte/Astro)** (fixed prior pass; `mask_vue`/`mask_svelte`/`mask_astro`). The `nuxt` ERROR
  in the sweep is a harness artifact — the cross-fed legacy side needs `plugin-vue` preprocessing the harness doesn't
  run; the genuine v2 driver handles `.vue` fine.

### B. Emitter divergences (given a correct config)

- **B1 — `color-mix` opacity loses the solid-color fallback** _(behavioral, needs a decision)_. `red.500/40`: legacy
  emits `--mix-color: color-mix(...); color: var(--mix-color, var(--colors-red-500))` (progressive enhancement for
  browsers without `color-mix`); v2 emits `color: color-mix(in srgb, var(--colors-red-500) 40%, transparent)` directly.
  Confirmed genuine in v2's `static_css.rs`. **Decision:** keep legacy's `--mix-*` fallback, or accept the
  simplification (drops support for non-`color-mix` browsers). Not a bug — a deliberate v2 choice that should be ratified.

### C. Intentional / cosmetic differences (not bugs)

- **Modern breakpoint syntax** — `md:` → legacy `@media screen and (min-width: 48rem)` vs v2 `@media (width >= 48rem)`
  (drops `screen and`, range syntax). Documented in CLAUDE.md (`to_rem`). Accounts for **3 of the 5** remaining battery
  mismatches (`responsive_obj`, `responsive_arr`, `multiline_responsive`) — each diffs *only* on `@media` lines. Range
  syntax needs newer browsers; verify target support is acceptable.

- **Nested-condition selector-part order** — `_hover._dark` → legacy `…:is(:hover, [data-hover]).dark` vs v2
  `….dark:is(:hover, [data-hover])`. Same specificity, same matched elements — functionally identical, byte-different
  only. The 5th remaining battery mismatch (`nested_cond`); not worth the selector-ordering churn to chase.

- **Intra-rule declaration order** in reset/base (e.g. `line-height` vs `--font-fallback` first). Visually identical;
  only matters for byte-diff snapshots.

### D. Ruled out (harness artifacts, NOT v2 bugs)

- Sweep diff-line counts (600–1000+ per sandbox) are dominated by **token-layer var ordering**, **breakpoint syntax**,
  and the **A4 hook delta** — not emitter correctness. Selector counts stay within ±a few everywhere. The byte upticks
  after this pass (e.g. `next-js-pages` 24966→25686 B) are the now-**correct** gradient machinery, not a regression.

---

## 5. Severity summary & recommendations

**Blocking for default-flip (front-end):**

1. **A1 dynamic-import bundle** — write Rolldown chunks to a temp dir (or `inlineDynamicImports`).
2. **A3 preset injection** — the loader must inject default presets to produce correct output for standard configs.

**Emitter — fixed this pass (verified vs legacy + runtime):**

3. ~~**F1 utility-values var refs**~~ ✅ — `getTokenCategoryValues` returns the var form.
4. ~~**F2 token() class naming**~~ ✅ — hash by resolved value, not path.
5. ~~**F3 gradient transform alias**~~ ✅ (was B4) — preserve alias for transform props.

**Verify intent (likely fine):**

6. **B1 color-mix fallback** — keep legacy's `--mix-*` progressive-enhancement pattern, or accept the simplification.
7. **C breakpoint range syntax** — browser-target call (accounts for 3/5 remaining battery diffs).
8. **A4 hook execution** — token pruning / custom cssgen hooks won't run; expected per scope, document the delta.

**Bottom line:** Driven through the **v2 API**, the **emitter is now at 15/20 byte-identical** on the core surface
(atomic css, conditions, `!important`, recipes incl. compound/default variants, patterns, `token()`, color **and
spacing/size tokens**, **gradients**), and **~23–360× faster** on extraction. The three bugs found this pass were all in
the **js-callback value/transform bridge** — the seam between the serialized config and the Rust engine — and are fixed.
The remaining 5 battery diffs are 3× intentional breakpoint syntax, 1× cosmetic selector ordering, and 1× the color-mix
fallback decision. The work that still blocks a drop-in replacement is concentrated in the **front-end** (A1 bundle, A3
preset injection).

---

### Reproduce

```sh
pnpm exec vitest run bench/__tests__/perf.test.ts        # timing
pnpm exec vitest run bench/__tests__/edgecases.test.ts   # 20-case emitter battery (15/20 identical)
pnpm exec vitest run bench/__tests__/parity.test.ts      # 12-sandbox e2e sweep
pnpm exec vitest run bench/__tests__/genuine.test.ts     # real v2-driver path
pnpm --filter @pandacss/compiler test                    # binding round-trip (139 tests)
cargo nextest run --workspace --locked                   # 1164 Rust tests
# per-case CSS written to bench/.parity-out/
```
