---
'@pandacss/config': minor
---

`extend` now decides whether you add to a preset or replace it. Write a theme key without `extend` and it replaces what
a preset put there instead of merging into it.

Replacement happens at the entry you name, so `theme.tokens.colors` replaces the color scale and leaves `spacing` alone,
and `theme.recipes.button` replaces that one recipe. Keys whose entries are plain values, like `breakpoints`, replace
whole.

If you relied on a bare key merging, add `extend` to keep the old result.
