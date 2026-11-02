---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix the order of rules whose selectors contain `:has()` or a list of states, so the right one wins.

- `&:has(> input:checked)` no longer overrides `&:has(> input[aria-invalid=true])` because of the `:checked` inside it.
- `&:is(:hover, :focus-visible)` no longer overrides `_active`; a selector list ranks as its strongest state.
- The lint plugin warns when two conditions on one property can't keep the order you wrote them in.
