# staticCss build time — v1 vs v2

## Summary

A large `staticCss` block used to dominate the build — [#3106](https://github.com/chakra-ui/panda/discussions/3106)
measured it at 13.35s, 30s+ with more PostCSS plugins. On v2 the same config now builds in ~0.3s, ~85× faster than v1.

Getting there took a fix, not just the Rust rewrite: v2 was resolving condition queries per lookup, which made emit
scale with `rules × containers²`. Until that landed, v2 built this config in 12–14s. The durable harness design lives in
[benchmark-suite](../design-notes/benchmark-suite.md).

**Date:** 2026-08-13 · **v2 rev:** `6bcc8859c` · **Machine:** darwin-arm64, node v22.20 · **Runs:** 5, median

## Background

Two discussions report the same thing — build time, not wrong CSS:

- **#3106** — 3.47s without `staticCss`, 13.35s with it, 30s+ once more PostCSS plugins pile on.
- **#3256** — the follow-up: add a build cache so `staticCss` stops regenerating the whole stylesheet on every change.

The cost is combinatorial: properties × values × conditions, plus `['*']` wildcards that fan out to whole token
categories.

## Method

Both discussions post their config. They're variants of the same matrix — ~35 font sizes, ~136 spacing values, the
`['*']` wildcard block and the condition block — and both use container-query conditions (`@pb/sm`, `@pb/md`, …).

Those conditions only resolve when `theme.containers` is populated, which is what `preset-panda` supplies. **A config
without it silently drops them**, emitting ~10,000 fewer rules and zero `@container` blocks, on both engines. Timings
taken that way are not measuring the reported workload — check the `@container` count before trusting a number here.
The runs below include `preset-base` + `preset-panda` and emit 4 `@container` blocks.

Measured through `panda cssgen` end to end, so config load, codegen and emit are all included.

## Results

The #3106 config: 29,235 rules, 2,382,797 bytes, 4 `@container` blocks.

- **v1** (`@pandacss/dev@1.11.3`) — 25.7s
- **v2 before the condition fix** — 12.3–14.0s
- **v2 today** — **0.27–0.32s**, ~85× faster than v1

Output is byte-identical between the last two, so the fix cost nothing in CSS.

## Where the time went

`--profile` on the pre-fix build put 9,937ms of a 9,951ms build inside `emit_css`; extraction was 2.3ms and config load
8ms. The rewrite had already made extraction ~3,600× faster than v1's reported 8.4s, but emission had a quadratic in
it.

`Theme::container_conditions()` rebuilt its map on every call, and a scale of N sizes expands to ~N²/2 + 3N conditions
(the `smToLg` cross-product), each a freshly formatted `String`. `container_condition_query()` then scanned that map
linearly, and the emitter and sorter call it for every condition on every rule. `breakpoint_condition_query()` had the
same shape.

The scales now live in a private `ConditionScales` that resolves both lookup maps as it deserializes, so they cannot
drift from the scales they derive from.

## Container-scale sweep

`cargo run -p pandacss_bench --bin static_css_conditions --release` holds the rule count fixed at 9,319 and grows only
the container scale. Every row emits byte-identical CSS — 552,322 bytes, 4 `@container` blocks — so the extra time
bought nothing.

- **4 containers** — 398.9ms → 23.3ms (**17×**)
- **8** — 1,124.1ms → 23.3ms (**48×**)
- **14** (what `preset-panda` ships) — 2,942.4ms → 23.6ms (**125×**)
- **32** — 13,898.8ms → 25.0ms (**556×**)
- **64** — 52,644.6ms → 28.7ms (**1,833×**)

Growth from a 4-size scale to a 64-size scale: 132× before, 1.23× after. The residual is the one-time O(N²) map build,
which is the real work.

`crates/pandacss_stylesheet/tests/condition_cost.rs` guards this. The emitted CSS is identical either way, so only a
timing assertion can catch a regression: it fails at 82× on the old code and passes at ~1.1× today.

## Output parity

v2's `staticCss` expands fully — container queries, breakpoints, hover and focus states, every utility class. It isn't
byte-identical to v1: v1 collapses more rules into comma-joined selectors than v2 does today, so v2's file is larger
(2.38MB vs 1.93MB). That's a size difference, not missing CSS. Full minify parity is still open (see
[stylesheet](../design-notes/stylesheet.md)).

## About #3256

You don't need the build cache anymore — a full `staticCss` build is sub-second. v2 also warns when a `['*']` wildcard
fans out to a huge set, which v1 never did. That's aimed straight at the `color: ['*']` pattern in these configs. The
incremental rebuild #3256 actually asked for was not implemented; the full rebuild is just fast enough that it stopped
mattering.

## Related

- Discussions [#3106](https://github.com/chakra-ui/panda/discussions/3106),
  [#3256](https://github.com/chakra-ui/panda/discussions/3256)
- [benchmark-suite](../design-notes/benchmark-suite.md) — durable harness design
- [stylesheet](../design-notes/stylesheet.md) — CSS emission and the minifier boundary
