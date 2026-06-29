---
'@pandacss/config': minor
---

Name a package in `include` and Panda scans it for you. A library that uses Panda but isn't a design system — say a charts package built on `@acme/ds` — can go straight in `include` as a bare specifier (or via `--include`); Panda resolves it and globs its source so its styles land in your CSS. No hand-written `./node_modules/...` glob, and the package's own dependencies are skipped.

If you point `include` at an actual design system (a package shipping `panda.lib.json`), Panda stops and tells you to move it to `designSystem` — and reports every one at once, not one per run. Plain globs and local folder names work exactly as before.
