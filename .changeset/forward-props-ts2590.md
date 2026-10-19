---
'@pandacss/compiler': patch
---

Fix `TS2590: Expression produces a union type that is too complex to represent` when `forwardProps` names a style prop on a component with many props, like `styled('input', {}, { forwardProps: ['color'] })`.
