---
'@pandacss/compiler': patch
---

Fix a comma member of a nested `&` selector losing its class scope, leaking a bare selector that could match `<html>` and blank the page.

A nested-selector key may mix `&` and non-`&` comma members, e.g.
`css({ '&:not(:first-child), :only-child': { … } })`. The engine substituted the parent into members that contain `&`, but left members **without** `&` untouched — so `:only-child` was emitted as a bare, unscoped selector. A bare `:only-child` matches `<html>` (the document's only element child); with `display: none` in the block that hid the entire app.

`replace_selector_parent` now scopes every comma member: a member with `&` substitutes the parent (`.cls:not(:first-child)`), and a member without `&` becomes a descendant of the parent (`.cls :only-child`) — exactly how a whole `&`-free selector is already treated. This matches legacy Panda, which scopes each member.
