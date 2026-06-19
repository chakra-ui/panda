---
'@pandacss/compiler': patch
---

Fix several nested arbitrary selector edge cases.

- Keep `&` intact inside quoted attribute selector values, like `[data-category="sound & vision"]`.
- Keep parent selectors like `&:last-child` attached to the parent when followed by a nested descendant such as `& .divider`.
- Scope comma selector members without `&` as descendants.
- Wrap combinator parents in `:is()` when a nested selector contains multiple `&` tokens.
