---
'@pandacss/cli': minor
'@pandacss/compiler': minor
---

Add `--profile` to any command. It writes `trace.json` (open in `chrome://tracing` or `ui.perfetto.dev`) and `timings.json` (per-span totals and slowest files) to `.panda/`, or into `panda debug --outdir` when combined with `debug`. Replaces v1's `--cpu-prof`, which couldn't see time spent in the Rust engine.
