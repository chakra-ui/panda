---
'@pandacss/config': patch
'@pandacss/node': patch
---

Fix `panda.config.xxx` file dependencies detection when using the builder (= with PostCSS or with the VSCode extension).
It will now also properly resolve tsconfig path aliases.
