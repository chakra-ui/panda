---
'@pandacss/compiler': patch
---

Precompute the static styles of a `styled.*` element that also spreads unknown props. The factory and the spread stay
so runtime style props still work; everything Panda can see at build time collapses into one `className`.
