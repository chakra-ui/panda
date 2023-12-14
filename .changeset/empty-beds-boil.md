---
'@pandacss/generator': patch
'@pandacss/types': patch
---

Fix `slotRecipes` typings, [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added
to `config.recipes` weren't added to `config.slotRecipes`
