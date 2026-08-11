---
'@pandacss/transformer': patch
---

Fix `styled(Component, styles)` chains crashing with `cvaA.merge is not a function` when the transform is enabled. The
internal recipe runtime now implements `merge`, so a chain collapses to one composed recipe at definition time as it
does untransformed.
