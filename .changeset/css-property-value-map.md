---
'@pandacss/compiler': patch
---

Improve generated style prop types for native CSS values.

When `strictTokens` is off, shorthands like `bg`, `bgColor`, and `color` accept matching CSS values. Keyframe steps now
use the same style object types as global CSS.
