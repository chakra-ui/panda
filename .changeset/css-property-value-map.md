---
'@pandacss/compiler': patch
---

Improve generated style prop types for native CSS values and Panda utilities.

Utility shorthands like `bg`, `bgColor`, and `color` now accept the matching native CSS values when `strictTokens` is off. Keyframe steps also use the same style object types as global CSS.
