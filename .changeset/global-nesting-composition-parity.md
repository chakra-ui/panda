---
'@pandacss/compiler': patch
---

Fix v2 CSS output for `globalCss` and nested style objects.

Bare element selectors now nest as descendants, comma selector groups keep the parent on every member, compositions merge
with sibling properties, and multiline values produce stable class names.
