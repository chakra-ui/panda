---
'@pandacss/compiler': patch
---

Fix nested arbitrary selector edge cases.

Panda now preserves `&` inside quoted attribute values, scopes comma selector groups correctly, and keeps parent
selectors attached when nested descendants follow.
