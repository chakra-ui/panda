---
'@pandacss/node': patch
---

Skip writing a generated artifact when its content is byte-identical to what is already on disk.

`panda --watch` re-emits the full `styled-system` output on its initial build, and codegen re-runs on config changes. Rewriting unchanged files bumped their mtime and triggered needless dev-server reloads (e.g. a Vite full page reload or webpack recompile) for tools watching the output directory.
