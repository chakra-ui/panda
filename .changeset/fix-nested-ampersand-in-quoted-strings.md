---
'@pandacss/compiler': patch
---

Fix nested `&` replacement corrupting ampersands inside quoted attribute selector values.

Selectors such as `css({ '&[data-category="sound & vision"]': { … } })` now emit `[data-category="sound & vision"]` instead of replacing the `&` inside the string.
