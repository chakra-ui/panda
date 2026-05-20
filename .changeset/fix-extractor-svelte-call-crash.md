---
'@pandacss/extractor': patch
---

Fix `Could not find source file: '<path>.svelte'` crash in `panda cssgen` when a Svelte `<script>` contains any unresolved call expression (e.g. Svelte 5 runes like `$state`, `$derived`). The compiled-JSX runtime detector now resolves same-file declarations from the AST instead of via the TypeScript language service, which can't see non-TS file extensions.
