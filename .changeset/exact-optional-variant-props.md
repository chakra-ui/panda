---
'@pandacss/compiler': patch
---

Fix generated types rejecting `undefined` under `exactOptionalPropertyTypes`: recipe variant props and style props like
`css({ color: isActive ? 'red' : undefined })` now type-check, and Preact styled components work as JSX elements with
that option on.
