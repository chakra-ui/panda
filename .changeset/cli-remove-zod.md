---
'@pandacss/cli': patch
---

Replaced `zod` with a small local flag validator. `zod` resolved ~76 separate ESM files at CLI startup; removing it cuts a meaningful chunk of Node's module-loading overhead on every `panda` invocation, most noticeable on fast commands like `codegen`.
