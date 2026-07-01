---
'@pandacss/compiler': patch
---

Fix generated token types when a category has no tokens. A config with missing or empty categories no longer collapses `TokenValue` to bare `string`, so native CSS value autocomplete (e.g. `currentColor`) stays intact.
