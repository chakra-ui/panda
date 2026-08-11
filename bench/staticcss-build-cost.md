# staticCss build time — v1 vs v2

## Summary

A large `staticCss` block used to dominate the build — [#3106](https://github.com/chakra-ui/panda/discussions/3106)
measured it at 13.35s, 30s+ with more PostCSS plugins. On v2 the same config builds in under 0.4s, ~30× faster. This is
a point-in-time result; the durable harness design lives in [benchmark-suite](../design-notes/benchmark-suite.md).

**Date:** 2026-08-11 · **v2 rev:** `823d4a284` · **Machine:** darwin-arm64, node v22.20 · **Runs:** 5, median

## Background

Two discussions, same author, report the same thing — build time, not wrong CSS:

- **#3106** — 3.47s without `staticCss`, 13.35s with it, 30s+ once more PostCSS plugins pile on.
- **#3256** — the follow-up: add a build cache so `staticCss` stops regenerating the whole stylesheet on every change.

The cost is combinatorial: properties × values × conditions, plus `['*']` wildcards that fan out to whole token
categories.

## Method

Both discussions post their config. They're variants of the same matrix — ~35 font sizes, ~136 spacing values, the
`['*']` wildcard block and the condition block. Each config was rebuilt and timed on both engines over the **same
resolved config**, so the engine is what's measured, not the config loader:

- **v1** — `@pandacss/node`: `loadConfigAndCreateContext` → `appendBaselineCss` (runs `staticCss.process`) → `getCss`.
- **v2** — `@pandacss/compiler`: `createCompilerFromSnapshot` → `compile()`.

## Results

| Config | v1 | v2 | Faster |
| --- | ---: | ---: | ---: |
| #3106 | ~12.4s | ~0.38s | **~33×** |
| #3256 | ~13.7s | ~0.39s | **~35×** |

v1 spends ~12–14s, about 3s of it purely in `staticCss`. v2 does the whole build in under 0.4s. That's the 13.35s →
sub-second the discussions were asking for. Across 5 runs v2 is steady to within ~10ms; v1 swings run to run, so read
the multiplier as ~30×+, not a fixed figure.

## Output parity

v2's `staticCss` expands fully — breakpoints, hover and focus states, every utility class. It isn't byte-identical to
v1: v1 collapses more rules into comma-joined selectors than v2 does today, so v2's file is larger. That's a size
difference, not missing CSS. Full minify parity is still open (see [stylesheet](../design-notes/stylesheet.md)).

## About #3256

You don't need the build cache anymore — a full `staticCss` build is sub-second. v2 also warns when a `['*']` wildcard
fans out to a huge set, which v1 never did. That's aimed straight at the `color: ['*']` pattern in these configs.

## Related

- Discussions [#3106](https://github.com/chakra-ui/panda/discussions/3106),
  [#3256](https://github.com/chakra-ui/panda/discussions/3256)
- [benchmark-suite](../design-notes/benchmark-suite.md) — durable harness design
- [stylesheet](../design-notes/stylesheet.md) — CSS emission and the minifier boundary
