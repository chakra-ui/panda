# Panda v2 (Rust/Oxc) vs Legacy (ts-morph) — Comparison Report

**Date:** 2026-06-08 · **Branch:** v2 · **Native artifact:** `packages/compiler/compiler.node` (built 2026-06-08)

Comparison of the v2 Rust/Oxc compiler against the legacy TypeScript (ts-morph) pipeline across **performance**, **style
output**, and **feature parity**. All harnesses live in `bench/__tests__/` and are reproducible:
`pnpm exec vitest run bench/__tests__/<name>.test.ts`.

---

## 1. Methodology

Two comparison surfaces, because v2 has two distinct halves with very different maturity:

- **Front-end** (config + discovery) — legacy `loadConfigAndCreateContext` vs v2 `createNodeDriver` (real
  config-loader). Isolates config loading, glob, presets, hooks.
- **Compiler/emitter** — legacy fixture `PandaContext` vs v2 `createCompilerFromSnapshot` fed the **same resolved
  config**. Isolates the encoder + stylesheet from the config-loader.

Cross-feeding the _same_ resolved config into both engines is the only way to get an apples-to-apples emitter diff,
because v2's own config-loader cannot yet load most real configs (see §4-A). CSS is normalized with
`@projectwallace/format-css` before diffing.

**Harnesses:** `perf.test.ts` (timing), `parity.test.ts` (e2e sweep, 12 sandboxes), `genuine.test.ts` (real
config-loader path), `edgecases.test.ts` (20-case emitter battery).

---

## 2. Performance — v2 wins decisively on the hot path

Setup excluded, identical resolved config, 100-file synthetic corpus (css + cva + jsx + patterns + conditions):

- **Cold parse** (100 files, once) — legacy 187 ms → v2 7.5 ms = **25× faster**
- **Warm re-parse** (single file, steady state) — legacy 690 µs/file → v2 1.8 µs/file = **~390× faster**
- **CSS emit** (atoms → stylesheet) — legacy 6.0 ms → v2 4.7 ms = ~1.3× faster

End-to-end sweep over real sandboxes (full parse+emit wall time) corroborates: larger projects favor v2 strongly
(`next-js-pages` 768→31 ms ≈ **25×**, `qwik-ts` 564→34 ms ≈ **16×**); trivial 2-file projects can favor legacy purely
because v2's native compiler construction dominates when there's almost nothing to parse.

**Caveats:** (1) The warm 390× reflects ts-morph re-parsing cost vs Oxc — the watch-mode hot path — and is the single
largest win. (2) v2 emit is _not_ yet apples-to-apples: legacy emit runs PostCSS (merge/minify); v2 emits raw strings
with **no optimizer** (lightningcss deferred). A fair emit comparison must wait for v2's optimizer.

---

## 3. Style-output parity — the emitter is largely at parity

20-case emitter battery (`edgecases.test.ts`), clean fixture config, comparing utilities+recipes layers. **At parity
(byte-identical after formatting):**

- ✅ Pseudo conditions — `_hover`, `_focusVisible`, nested condition values
- ✅ `!important` — both `red.500!` and `bold !important` forms
- ✅ **Recipes (`cva`)** — base, variants, **compoundVariants**, **defaultVariants**
- ✅ Patterns — `stack()`/`hstack()` calls and `<Stack>` JSX
- ✅ `token('colors.red.500')` resolution + string concatenation
- ✅ **Color tokens** — `color: 'red.500'` → `.c_red\.500 { color: var(--colors-red-500) }`
- ✅ Conditional value maps — `bg: { _hover, _active, _disabled }`
- ✅ Arbitrary raw values — `calc(100% - 20px)`, `840px`
- ✅ Color-token class naming + `var()` indirection (the canonical config shape)

Across the 12-sandbox sweep, **selector counts match within ±a few** on every project — the structural CSS is
equivalent. The differences are concentrated in the specific areas below.

---

## 4. Gaps found

### A. Front-end / config-loader gaps (genuine, currently blocking real-world use)

These are why v2 cannot yet drop-in replace legacy on most projects. All reproduced.

- **A1 — Config-loader crashes on dynamic-import configs** _(High)_. Configs using `await import()` (e.g.
  `sandbox/vite-ts`) make Rolldown code-split; `bundle.ts` evaluates only the entry chunk via a `data:` URL, so sibling
  chunks fail: `Failed to resolve "./dist-*.js"`. Evidence: `packages/config-loader/src/bundle.ts:48`
  (`importBundledConfig` keeps one chunk).

  **Minimal repro** — `panda.config.ts`:

  ```ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    include: ['src/**/*.tsx'],
    hooks: {
      'config:resolved': async ({ config }) => {
        const { someRecipe } = await import('./some-recipe') // Rolldown emits a second chunk
        config.theme ??= {}
        config.theme.recipes ??= {}
        config.theme.recipes.someRecipe = someRecipe
      },
    },
  })
  ```

  ```sh
  # v2 path — throws during loadPandaConfig / createNodeDriver
  pnpm exec vitest run bench/__tests__/genuine.test.ts  # fails on sandbox/vite-ts
  # Error shape: Failed to resolve "./dist-*.js" (sibling chunk from data: URL eval)
  ```

  Real fixture: `sandbox/vite-ts/panda.config.ts` + `sandbox/vite-ts/some-recipe.ts`.

- **A2 — File discovery returns 0 files for `./`-prefixed include globs** _(High)_ — ✅ **FIXED**.
  `include: ['./src/**/*.tsx']` matched nothing → **empty stylesheet**, silently. Isolated: `./src/**/*.tsx` → false,
  `src/**/*.tsx` → true, `src/**/*.{ts,tsx}` (braces) → true. So it was the leading `./`, not brace expansion. Hit
  `next-js-app`, `preact-ts` (both common conventions). Root cause: the glob walkers compared the `./`-prefixed pattern
  against cwd-relative paths (`src/App.tsx`). Fix: `normalize_pattern` strips a leading `./` at every match site in both
  `crates/pandacss_fs/src/glob.rs` (`matches_globs`/`default_walk`/`base_dir`) **and** the separate
  `crates/pandacss_fs/src/os.rs` walker (the one the real driver scan uses). next-js-app now scans 2 files, preact-ts 3
  — matching legacy. Covered by `tests/{glob,matches_globs,base_dir,os}.rs` (incl. `../` left intact).

  **Minimal repro** — `panda.config.ts`:

  ```ts
  export default {
    include: ['./src/**/*.tsx'], // ← v2 scan returns 0 files
    // include: ['src/**/*.tsx'], // ← works
    outdir: 'styled-system',
  }
  ```

  ```tsx
  // src/App.tsx — never parsed by v2 when glob has leading ./
  import { css } from 'styled-system/css'
  export const styles = css({ color: 'red.500' })
  ```

  ```sh
  # legacy finds files; v2 driver.scan().length === 0 → empty CSS, no error
  pnpm exec vitest run bench/__tests__/parity.test.ts  # next-js-app, preact-ts diverge
  ```

  Real fixture: `sandbox/next-js-app/panda.config.ts` (`include: ['./src/**/*.{js,jsx,ts,tsx}', …]`).

- **A3 — No automatic preset injection** _(High)_. v2's loader doesn't inject `preset-base`/`preset-panda`. Standard
  configs resolve incompletely → broken output: genuine `sandbox/solid-ts` emits `color: blue .500` (unresolved token,
  mangled dot) and `bg-gradient: to-r` (raw utility id as CSS property). Evidence: `packages/config-loader/src/load.ts:18`
  ("automatic preset injection … out of scope for now").

  **Minimal repro** — config without explicit `presets` (typical sandbox shape):

  ```ts
  export default {
    preflight: true,
    include: ['src/**/*.tsx'],
    outdir: 'styled-system',
    // no presets: ['@pandacss/preset-base', '@pandacss/preset-panda']
  }
  ```

  ```tsx
  import { css } from 'styled-system/css'

  css({
    color: 'blue.500', // legacy → var(--colors-blue-500); v2 → `color: blue .500`
    bgGradient: 'to-r',
    gradientFrom: 'red.200',
    gradientTo: 'blue.200', // v2 → raw props: bg-gradient, gradient-from, …
  })
  ```

  ```sh
  pnpm exec vitest run bench/__tests__/genuine.test.ts  # sandbox/solid-ts
  # Compare bench/.parity-out/sandbox_solid-ts.genuine.{legacy,v2}.css
  # v2 contains: `.color_blue\.500 { color: blue .500; }` and `.bg-gradient_to-r { bg-gradient: to-r; }`
  ```

  Real sources: `sandbox/solid-ts/src/scenarios/css-prop.tsx`, `sandbox/solid-ts/src/scenarios/gradient.tsx`.

- **A4 — Config hooks not executed** _(Med, by design)_. `hooks.cssgen:done` etc. don't run. `sandbox/vite-ts` uses
  `removeUnusedCssVars` to prune the token layer; v2 ignores it → emits **all 472 token vars vs legacy's 47 used**
  (+14 KB). Documented scope boundary, but a real output delta for any hook-using project. Evidence:
  `packages/config-loader/src/serialize.ts:13` (`hooks` in `runtimeOnlyKeys`).

  **Minimal repro** — `panda.config.ts`:

  ```ts
  import { removeUnusedCssVars } from './remove-unused-css-vars'

  export default defineConfig({
    hooks: {
      'cssgen:done': ({ artifact, content }) => {
        if (artifact === 'styles.css') {
          return removeUnusedCssVars(content) // prune unused --colors-* / --spacing-* vars
        }
      },
    },
    include: ['src/**/*.tsx'],
  })
  ```

  ```tsx
  // src/App.tsx — uses one token path
  import { css } from 'styled-system/css'
  css({ color: 'red.500' })
  ```

  ```sh
  # legacy styles.css: ~47 token vars; v2: all ~472 from preset theme
  pnpm exec vitest run bench/__tests__/parity.test.ts  # sandbox/vite-ts byte diff (+14 KB on v2)
  ```

  Real fixture: `sandbox/vite-ts/panda.config.ts` + `sandbox/vite-ts/remove-unused-css-vars.ts`.

- **A5 — Vue/Svelte/Astro need JS preprocessing** _(Med)_. `sandbox/nuxt` `.vue` files aren't handled by the raw path.
  By design (SFC preprocessing stays in JS), but the wiring isn't in the driver path yet. Evidence:
  `design-notes/scope-and-boundaries.md`.

  **Minimal repro** — `panda.config.ts`:

  ```ts
  export default defineConfig({
    include: ['./pages/**/*.{vue,ts,tsx}', './components/**/*.{vue,ts,tsx}'],
    jsxFramework: 'vue',
  })
  ```

  ```vue
  <!-- pages/index.vue — styles inside <script> or css() in setup; needs SFC extract before Oxc -->
  <script setup lang="ts">
  import { css } from '../styled-system/css'
  const styles = css({ color: 'red.500' })
  </script>
  ```

  ```sh
  pnpm exec vitest run bench/__tests__/parity.test.ts  # sandbox/nuxt, svelte, astro error or miss styles
  ```

  Real fixture: `sandbox/nuxt/panda.config.ts`.

### B. Emitter divergences (genuine, given a correct config)

- **B1 — `color-mix` opacity loses fallback.** `red.500/40`: legacy `--mix-color: color-mix(…); color: var(--mix-color,
  var(--colors-red-500))` vs v2 `color: color-mix(in srgb, var(--colors-red-500) 40%, transparent)`. v2 drops the
  `--mix-*` var + solid-color fallback for browsers without `color-mix`. Confirmed genuine via v2's own
  `static_css.rs:113`. **Behavioral.**

  **Minimal repro** — source (`edgecases.test.ts` → `color_opacity`):

  ```tsx
  css({ color: 'red.500/40', bg: 'blue.300/50' })
  ```

  Legacy emit:

  ```css
  .c_red\.500\/40 {
    --mix-color: color-mix(in srgb, var(--colors-red-500) 40%, transparent);
    color: var(--mix-color, var(--colors-red-500));
  }
  ```

  v2 emit:

  ```css
  .c_red\.500\/40 {
    color: color-mix(in srgb, var(--colors-red-500) 40%, transparent);
  }
  ```

  ```sh
  pnpm exec vitest run bench/__tests__/edgecases.test.ts
  # bench/.parity-out/case_color_opacity.{legacy,v2}.css
  ```

- **B2 — Object-form utility `values` class naming** _(Fixed 2026-06-08)_. Object-map `values: { '2': '0.5rem' }` must hash
  classes by the **alias key** (`mb_2`), not the resolved CSS (`mb_0\.5rem`). v2 now reverse-resolves normalized atom
  values via `Utility::class_name_value` before emit (legacy: `getOrCreateClassName(key, withoutSpace(value))` on the
  author input). String-category `values: 'spacing'` was already correct.

  **Minimal repro** — config utility + usage:

  ```ts
  // panda.config.ts (or fixture override)
  utilities: {
    marginBottom: {
      className: 'mb',
      values: { '2': '0.5rem', '4': '1rem' }, // object map, not token category
    },
  }
  ```

  ```tsx
  css({ marginBottom: '2' }) // runtime + static CSS both expect `.mb_2`
  ```

  ```css
  /* expected (legacy + v2 after fix) */
  .mb_2 { margin-bottom: 0.5rem; }
  ```

  ```sh
  cargo nextest run -p pandacss_stylesheet object_map_values_name_classes_by_alias_key --locked
  cargo nextest run -p pandacss_utility class_name_value_uses_object_map_alias --locked
  ```

  Contrast — string category form (always worked):

  ```ts
  marginBottom: { className: 'mb', values: 'spacing' }
  // css({ mb: '2' }) → .mb_2 { margin-bottom: var(--spacing-2); } ✅
  ```

- **B3 — Empty `@layer compositions {}` emitted** for unknown `textStyle`. Legacy emits nothing; v2 emits
  `@layer utilities { @layer compositions {} }`. Cosmetic; empty layer scaffolding.

  **Minimal repro**:

  ```tsx
  css({ textStyle: 'lg' }) // no `textStyles.lg` in config
  ```

  ```sh
  pnpm exec vitest run bench/__tests__/edgecases.test.ts  # case layer_style
  ```

- **B4 — Gradient utility group diverges.** `bgGradient:'to-r'`: legacy emits full `--gradient-stops`/`--gradient-position`
  machinery; v2 emits `.bg-grad_to_right { background-image: to right }` (invalid). Reproduced in cross-fed battery;
  needs genuine-path confirmation (could be unimplemented utility group **or** a transform-callback wiring miss).
  **Likely genuine gap.**

  **Minimal repro** — source (`edgecases.test.ts` → `gradient`):

  ```tsx
  css({
    bgGradient: 'to-r',
    gradientFrom: 'red.200',
    gradientTo: 'blue.500',
  })
  ```

  Legacy emit:

  ```css
  .bg-grad_to-r {
    --gradient-stops: var(--gradient-via-stops, var(--gradient-position), …);
    --gradient-position: to right;
    background-image: linear-gradient(var(--gradient-stops));
  }
  ```

  v2 emit:

  ```css
  .bg-grad_to_right {
    background-image: to right; /* invalid — utility group incomplete */
  }
  ```

  ```sh
  pnpm exec vitest run bench/__tests__/edgecases.test.ts
  # bench/.parity-out/case_gradient.{legacy,v2}.css
  ```

- **B5 — Number formatting** — `opacity: 0.5` (legacy) vs `.5` (v2 strips leading zero). Cosmetic; lightningcss would
  normalize either way. Trivial.

### C. Intentional differences (not bugs — confirm they're desired)

- **Modern breakpoint syntax.** `md:` → legacy `@media screen and (min-width: 48rem)` vs v2 `@media (width >= 48rem)`.
  Documented in CLAUDE.md (`to_rem` normalization). v2 also drops the `screen and` media type. **Range syntax needs
  newer browsers** — verify target support is acceptable.

  **Minimal repro**:

  ```tsx
  css({ padding: { base: '2', md: '4' } })
  ```

  ```css
  /* legacy */ @media screen and (min-width: 48rem) { … }
  /* v2     */ @media (width >= 48rem) { … }
  ```

  ```sh
  pnpm exec vitest run bench/__tests__/edgecases.test.ts  # responsive_obj, multiline_responsive
  ```
- **Intra-rule declaration order** differs in reset/base (e.g. `line-height` vs `--font-fallback` first;
  `margin`/`box-sizing` order). Visually identical; only matters for byte-diff snapshots.

### D. Ruled out (harness artifacts, NOT v2 bugs)

- The literal-value class names (`mb_0.5rem`, `mt_calc(...)`) seen in the **sweep** were an artifact of feeding legacy's
  _post-resolution_ config (object-map `values`) to v2 — same root as B2. With canonical string-category `values`, v2 is
  correct. Verified against v2's own `static_css.rs` tests.

---

## 5. Severity summary & recommendations

**Blocking for default-flip (must fix):**

1. ~~**A2 `./` glob**~~ — ✅ **fixed**: `normalize_pattern` strips a leading `./` in both fs walkers + classifier.
2. **A1 dynamic-import bundle** — write Rolldown chunks to a temp dir (or `inlineDynamicImports`) instead of
   single-chunk `data:` URL.
3. **A3 preset injection** — the loader must inject default presets to produce correct output for standard configs.

**Correctness, fix before broad use:** 4. ~~**B2 object-`values` class naming**~~ ✅ fixed — alias-key class hashing via
   `class_name_value`. 5. **B4 gradient utilities** — confirm + implement the gradient group. 6. **B1 color-mix fallback**
   — decide whether to keep legacy's `--mix-*` fallback pattern (progressive enhancement) or accept the simplification.

**Verify intent (likely fine):** 7. **C breakpoint range syntax** — browser-target call. 8. **A4 hook execution** —
token pruning / custom cssgen hooks won't run; expected per scope, but document the output delta.

**Bottom line:** The v2 **emitter** is close to parity for the core surface (atomic css, conditions, `!important`,
recipes incl. compound/default variants, patterns, `token()`, color tokens) and is **25–390× faster** on extraction. The
remaining work is concentrated in the **front-end** (config loading, glob normalization, preset injection) plus a short
list of emitter edge cases (gradients, color-mix fallback). None of the emitter gaps are deep;
the front-end gaps are what currently block a drop-in replacement.

---

### Reproduce

```sh
pnpm exec vitest run bench/__tests__/perf.test.ts       # timing
pnpm exec vitest run bench/__tests__/edgecases.test.ts  # 20-case emitter battery
pnpm exec vitest run bench/__tests__/parity.test.ts      # 12-sandbox e2e sweep
pnpm exec vitest run bench/__tests__/genuine.test.ts     # real config-loader path
# outputs + per-case CSS written to bench/.parity-out/
```
