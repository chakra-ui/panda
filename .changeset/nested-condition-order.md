---
'@pandacss/compiler': patch
---

Fix nested conditions being reordered. A state around a condition like `_icon` now stays on the parent, so
`css({ _hover: { _icon: { color: 'red' } } })` emits `.x:hover :where(svg)` instead of `.x :where(svg):hover`.
