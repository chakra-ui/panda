---
'@pandacss/compiler': patch
---

Fix `animationName` rejecting every keyframe name under `strictTokens`. Generated types now inline the keyframe names
(`KeyframesValue = "spin" | "fadeIn" | …`) instead of pointing at a `keyframes` token category that never existed, so
`css({ animationName: 'spin' })` type-checks without the `[spin]` escape hatch.
