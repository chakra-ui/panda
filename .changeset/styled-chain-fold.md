---
'@pandacss/compiler': patch
---

Fold same-file `styled()` chains to their underlying element when the class string is constant, so
`<Button>` no longer pays for a `forwardRef` component level at runtime. Chains with variants, an
options argument, or a non-local base keep the existing runtime behaviour.
