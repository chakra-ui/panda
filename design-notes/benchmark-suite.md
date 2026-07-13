# Benchmark Suite

## Summary

`bench/` should be one harness that measures Panda in every mode it runs — build-time extraction, runtime/SSR, the
transformer, and generated CSS size — against both v1 and the competitive field, from a single entry point. Today it is
seven disconnected scripts plus four vitest files, each with its own corpus, timing conventions, and a single comparison
axis (v1↔v2). This note defines the extension: a `corpus × mode × target` matrix over a shared fairness harness, why the
competitor set is what it is, and what stays gated until minify parity lands.

The motivation is a real gap. Every competitor publishes headline build/HMR numbers; Panda publishes none, and the only
public Panda perf data is unfavorable (runtime `cva` ~2–3× slower than Tailwind+cva — chakra-ui/panda discussion #1982).
No maintained public benchmark includes the modern build-time cohort (Panda, StyleX, vanilla-extract) — the canonical
matrices (`andreipfeiffer/css-in-js`, `geeky-biz/css-in-js-benchmark`) are unmaintained and pre-date it. So a
reproducible cross-tool harness is both the missing evidence and the credibility story; the Rust/Oxc rewrite is the
reason to publish now.

## Scope

This note owns:

- the `bench/` matrix runner shape, corpora, and result schema
- the four measured modes and their fairness rules
- the competitor target set and adapter contract
- the label-and-gate policy for CSS size / emit

It does not own:

- the `tracing`/benchmark-output policy → [instrumentation](./instrumentation.md)
- CSS emission and the minifier boundary → [stylesheet](./stylesheet.md)
- the transformer crate itself → [transformer](./transformer/README.md)
- dated benchmark *result* reports → [`bench/`](./bench/) (this note is the durable design; those are point-in-time)

## Approach

A single entry (`pnpm bench` → `bench/src/index.ts`) drives a **corpus × mode × target** matrix. The existing scripts
become the mode *implementations*; the new code is a thin runner, a shared fixture/fairness layer, and a JSON result
schema. This is not a benchmark framework — the runner is a loop, the fairness rules are a shared helper, reporting is a
JSON file plus a table printer.

Rejected: keeping the scripts separate with just a competitor axis bolted on. The fairness rules (cold vs warm, minified
vs raw, same corpus) then stay copy-pasted per script and drift, which is exactly what makes a "source of truth"
untrustworthy.

```
bench/
  src/
    index.ts            # single entry: `pnpm bench [--mode] [--target] [--corpus] [--json]`
    runner.ts           # matrix loop + fairness harness (timing, warm/cold, gc, repeats, stats)
    schema.ts           # result JSON schema + table printer
    fixtures/           # shared corpora
    modes/{extraction,runtime,transformer,css-size}.ts
    targets/            # one adapter per comparison target (v1, v2, competitors)
  src/bin/*.rs          # existing Rust benches, invoked by the extraction mode for native numbers
  __tests__/            # existing vitest parity/correctness harnesses stay as guards
```

**Target adapter contract.** Each target exposes only the capabilities it has:
`{ name, kind: 'build' | 'runtime' | 'both', extract?(corpus), runtime?(corpus), cssSize?(corpus) }`. A mode iterates
only over targets that implement its capability; the runner records `n/a` for unsupported cells rather than fabricating
a number. The matrix is therefore sparse — pure-static competitors have no `runtime` cell.

## Modes

### Build-time extraction

Publish **three build numbers, not one** (mirroring how Tailwind v4 tells its story, and labeling each so a cache-hit is
never presented as general build speed — the "192µs" trap):

1. **Cold full build** — caches nuked via a `--prepare` hook (clears `crates/cache` state / node caches).
2. **Incremental, new styles** — one file changed, introducing new atoms.
3. **Incremental, no new styles** — one file changed, cache hit (where `crates/cache` should shine; the big multipliers
   live here — label them cache-hit).

Cold pass parses every file once; warm pass re-parses the largest file N times (steady-state µs/file). File I/O excluded
from timers. Reuses the `extract-compare.ts` / `perf.test.ts` methodology. v2 via `@pandacss/compiler`; v1 via
`@pandacss/node@1.11.3` (npm, not workspace — per the bench legacy-pinning rule). Also record **peak RSS** during cold
build — rarely measured publicly, so an easy differentiator for large monorepos.

### Runtime / SSR

Port `runtime-css.ts`: shop-page SSR (plain floor vs `css()` vs `styled`), scale sweep (1/100/400/1000 tiles), per-call
cached-vs-cold cost, plus client re-render. Keep the **cache guard** (cached must be ≥2× cheaper than cold) as a hard
assertion — it is the weakMemo-regression tripwire.

Panda is unusual in the cohort: it is build-time extraction *but also ships a runtime*, so it is exposed to both axes.
This mode tells the honest dual story around the documented soft spot (#1982): the **build-inlined path is effectively
free**, and the **memoized runtime path** (recent `memo()` work) closed the gap the weakMemo regression opened. When
comparing `cva` across tools, match feature scope or footnote it — the #1982 comparison was uneven because Panda's `cva`
merges *and* dedupes while the other side used separate libs.

### Transformer output

The `pandacss_transformer` crate is design-only today, so this mode ships in two stages:

- **Now:** correctness + compile-away ratio against the prototype logic — for each call site, does it compile to a plain
  string literal, inline concat, or a `cn` helper call? Report the fully-erased ratio and the residual runtime surface.
- **After the crate lands:** add transformed-vs-untransformed runtime cost and shipped-bundle-size deltas.

### CSS output size — label-and-gated

Emit the stylesheet per target per corpus; report **gzipped size and its growth curve** across the scale corpus
(100 / 1k / 10k sites) — the curve is what substantiates the atomic "plateau" claim against StyleX; a single point does
not. **Every v2 size/emit number is labeled `raw / unminified`** because v2 emits raw strings with no optimizer (minify
parity is the open [stylesheet](./stylesheet.md) follow-up). The fair, publishable comparison is **gated on that
follow-up** — until then the runner prints the raw number with the label and a note, and presents no v2-vs-competitor
size verdict. Deliberately gated rather than excluded, so the gap to minified stays trackable.

## Corpora

Deterministic (seeded, no `Date.now`/random drift), in-memory or checked-in, **never writes tracked files** (existing
bench rule). Every target receives byte-identical source strings keyed by identical paths.

| Corpus            | Source                           | Purpose                                       |
| ----------------- | -------------------------------- | --------------------------------------------- |
| `sandbox-vite-ts` | checked-in `sandbox/vite-ts`     | small real app, normal extraction             |
| `synth-100`       | generated (as in `perf.test.ts`) | scales past tiny sandboxes; deterministic     |
| `jsx-heavy`       | generated (as in `jsx-heavy-*`)  | style-prop / factory heavy                    |
| `large-generated` | generated, N configurable        | stress cold-build + memory                    |
| `scale-curve`     | generated at 100 / 1k / 10k      | CSS-size + build-time **curve**, not a point  |

Lean realistic (a real component library / large sandbox), not micro-benches — the "22 buttons" synthetic corpus is the
main credibility hole in existing public benchmarks, and they explicitly warn their data says nothing about scaling.

## Fairness rules

Applied uniformly by the shared harness:

- Setup/construction cost reported separately from steady-state (v2 native construction dominates trivial corpora — do
  not fold it into per-file numbers).
- Cold vs warm always labeled; each of the three build modes carries its own label.
- Same corpus, same source strings, same paths across all targets.
- Legacy/competitor deps pinned to published npm versions, resolved as installed (no `--conditions source`); v2 packages
  on `workspace:*`.
- Statistical rigor (hyperfine pattern): repeated runs reporting min/mean/median/stddev with outlier detection, not a
  single sample; `--prepare` cache-nuke for cold runs; force GC between phases where the runtime allows. CI should pin
  the CPU governor to `performance` and run isolated (background processes add 5–15% noise).
- Match feature scope across tools, or footnote the asymmetry (the #1982 `cva` merge+dedupe trap).
- Minification state labeled on every size/emit number; on the css-size axis both sides minified or both raw, never
  mixed.
- Record repo commit + hardware + target versions in the result header. Treat all vendor headline numbers as directional
  only — they are vendor-run on vendor templates.

## Result schema

`results.json`: `{ meta: { commit, hardware, date, versions }, rows: [{ mode, corpus, target, metric, value, unit,
labels: ['cold' | 'warm' | 'cache-hit' | 'raw-unminified' | ...], na?: true }] }`. A table printer renders it; `--json`
emits it raw. CI diffs `results.json` against a stored baseline — the runtime cache guard is the first regression gate,
cold-build time the second.

## Competitor axis

Grouped by why each target is in the matrix:

| Target                | Category                          | Modes             | Role                                            |
| --------------------- | --------------------------------- | ----------------- | ----------------------------------------------- |
| Panda v2              | build-time extraction + runtime   | all four          | subject                                         |
| Panda v1              | build-time extraction + runtime   | all four          | own baseline (regression + rewrite payoff)      |
| StyleX                | build-time atomic + small runtime | build, css-size   | closest ergonomic peer; owns "CSS plateaus"     |
| vanilla-extract       | build-time zero-runtime           | build, css-size   | closest ergonomic peer                          |
| Tailwind v4           | build-time atomic (Rust/Oxide)    | build, css-size   | atomic-output + build-speed bar                 |
| UnoCSS                | build-time on-demand atomic       | build, css-size   | build-speed bar                                 |
| Emotion               | runtime CSS-in-JS                 | runtime, css-size | "runtime baseline you're beating"               |
| styled-components     | runtime CSS-in-JS                 | runtime, css-size | runtime baseline                                |
| CSS Modules           | build-time, no runtime            | build, css-size   | zero-runtime reference point                    |

## Phasing

1. Runner + schema + shared fixtures + fairness harness; port extraction & runtime modes onto it with no behavior
   change. Ship `pnpm bench`.
2. Competitor adapters (build + size where applicable).
3. Transformer mode stage 1 (correctness + compile-away ratio).
4. CSS-size mode behind the label-and-gate; wire the CI regression diff.
5. (Gated) fair size/emit comparison once minify parity lands; transformer mode stage 2 once the crate lands.

## Unresolved Questions

- Which real component library / large app to use as the realistic corpus, vs staying fully synthetic.
- Whether to later publish `bench/` as a PR-able open harness (marketing + moat) — an option, not current scope.
- How competitor adapters run in CI without their toolchains bloating install/build time (pinned, cached, or opt-in).

## Related

- [Instrumentation](./instrumentation.md) — tracing spans + release-only benchmark output policy.
- [Native stylesheet compiler](./stylesheet.md) — the minifier boundary the css-size gate depends on.
- [Transformer](./transformer/README.md) — the crate the transformer mode measures.
- [`bench/`](./bench/) — dated benchmark result reports.
