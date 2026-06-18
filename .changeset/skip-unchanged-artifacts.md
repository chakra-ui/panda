---
'@pandacss/node': patch
---

Skip writing generated artifacts when their content is byte-identical to what is already on disk.

`panda --watch` re-emits output on its initial build, and codegen re-runs on config changes. Rewriting unchanged files bumped their mtime and triggered needless dev-server reloads for tools watching the output directory. Watch-mode incremental CSS updates now route through the same write path.
