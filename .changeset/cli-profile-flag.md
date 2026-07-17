---
'@pandacss/cli': minor
'@pandacss/compiler': minor
---

Add `--profile` to any command. It writes `trace.json` and `timings.json` to `.panda/` (or into `panda debug --outdir`). Open the trace in `chrome://tracing` or `ui.perfetto.dev`. Replaces v1's `--cpu-prof`.
