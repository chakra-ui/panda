# staticCss condition-lookup caching

Investigation and fix for the `staticCss` build times reported in
[#3106](https://github.com/chakra-ui/panda/discussions/3106) and
[#3256](https://github.com/chakra-ui/panda/discussions/3256).

Benchmark: `bench/src/bin/static_css_conditions.rs` — run with
`cargo run -p pandacss_bench --bin static_css_conditions --release`.

## What users reported

Both discussions come from the same project: a large `staticCss` matrix (~35 font sizes, ~136 spacing values, `['*']`
wildcard blocks) whose conditions are container queries — `@pb/sm`, `@pb/md`, `@pb/lg`, `@pb/xl`. #3106 measured 3.47s
without `staticCss`, 13.35s with it, 30s+ once more PostCSS plugins were added. #3256 asked for a build cache so
`staticCss` would stop regenerating the whole stylesheet.

## Root cause

Resolving one condition key expanded the whole scale, every single time it was called:

- `Theme::container_conditions()` rebuilt its `BTreeMap` from scratch on each call.
- `ranges::expanded_range_conditions()` generates the `smToLg` cross-product, so a scale of N sizes produces ~N²/2 + 3N
  conditions — each one a freshly formatted `String`.
- `container_condition_query()` then did a linear `find` over that Vec.
- `Config::container_condition()` is called per condition per rule from `emitter.rs`, `sort.rs`, `conditions.rs`, plus
  from `is_condition_key()`.

Net effect: emit cost scaled with **rules × containers²**. `breakpoint_condition_query()` had the identical shape.

`preset-panda` ships 14 container sizes, so every project on it paid a ~266-condition rebuild per lookup.

## Fix

`breakpoints`, `containers` and `containerNames` moved into a private `ConditionScales` on `Theme`
(`crates/pandacss_config/src/theme.rs`), flattened so the serialized config shape is unchanged. Its `Deserialize` impl
builds the two lookup maps once, and every field is private, so the scales and the queries derived from them cannot
drift apart. There is no interior mutability and no post-load mutation surface.

An earlier revision cached lazily behind `OnceLock`, which was ~25% slower at large scales and left the scale fields
public, so a later mutation would have silently served stale queries.

The two `*_condition_names()` accessors became crate-private `*_condition_keys()` iterators. `condition_names()` was
their only caller and it collects into a `BTreeSet`, so nothing observes the order these maps are iterated in — and now
nothing outside the crate can start depending on it.

## Benchmark results

Rule count is held fixed at 9,319; only the container scale grows. Median of 5 iterations, release build, M-series
macOS.

- **0 containers** — 33.3ms before, 31.8ms after. Reference row only: with an empty scale the `@pb/*` conditions do not
  resolve at all, so this row emits **zero** `@container` blocks and a different stylesheet (581,994 bytes). It is not
  comparable to the rows below.
- **4 containers** — 398.9ms → 23.3ms (**17.1×**)
- **8 containers** — 1,124.1ms → 23.3ms (**48.2×**)
- **14 containers** (what `preset-panda` ships) — 2,942.4ms → 23.6ms (**124.5×**)
- **32 containers** — 13,898.8ms → 25.0ms (**555.6×**)
- **64 containers** — 52,644.6ms → 28.7ms (**1,833×**)

Every populated row emits byte-identical CSS — 552,322 bytes, 9,319 rules, 4 `@container` blocks — before and after. The
extra time bought nothing.

Growth from a 4-size scale to a 64-size scale: **132× before, 1.23× after**. The residual is the one-time O(N²) map
build, which is the real work.

## End-to-end

The #3106 config (full matrix, `preset-base` + `preset-panda`, 29,235 rules, 2,382,797 bytes, 4 `@container` blocks),
measured through `panda cssgen`:

- v1 (`@pandacss/dev@1.11.3`): **25.7s**
- v2 before this fix: **12.3–14.0s**
- v2 after this fix: **0.27s**

Output is byte-identical to the pre-fix v2 output. The `--profile` span breakdown before the fix put 9,937ms of a
9,951ms build inside `emit_css`; after it, `emit_css` is 98ms and `compile_config` 4ms.

## A measurement trap

A run of these configs that finishes in ~0.3s **without** the fix is measuring a theme whose `containers` scale is empty
— usually because `preset-panda` was left out. The `@pb/*` conditions are then silently dropped and roughly 10,000 rules
never get emitted. Check `@container` block count before trusting a timing on this config: the correct output has 4, and
both v1 and v2 emit 0 when the scale is empty.

## Not addressed

#3256 also asks for incremental rebuilds so a one-property change doesn't regenerate the whole stylesheet. This fix
makes the full rebuild fast enough that the question is much less pressing, but no `staticCss` result cache was added.
