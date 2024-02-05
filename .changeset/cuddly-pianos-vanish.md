---
'@pandacss/node': patch
---

Refactor the `--cpu-prof` profiler to use the `node:inspector` instead of relying on an external module
(`v8-profiler-next`, which required `node-gyp`)
