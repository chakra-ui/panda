---
'@pandacss/compiler': patch
---

Fix nested `&` replacement corrupting ampersands inside quoted attribute selector values, scope comma members without `&` as descendants, and wrap combinator parents in `:is()` when a nested selector contains multiple `&` tokens.

- `css({ '&[data-category="sound & vision"]': { … } })` keeps the `&` inside the quoted attribute value.
- `css({ '&:not(:first-child), :only-child': { … } })` scopes `:only-child` as a descendant instead of emitting a bare selector that can match `<html>`.
- `css({ '& .divider': { '& .bar & .baz': { … } } })` emits `:is(parent)` for each `&` when the parent selector contains a combinator.
