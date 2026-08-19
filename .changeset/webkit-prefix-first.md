---
'@pandacss/preset-base': patch
---

Emit `-webkit-*` before the unprefixed property on `backdropFilter`, `mask*`, `appearance`, `clipPath`, `backgroundClip`, and the other prefixed twins. Lightning CSS drops the standard declaration when the prefix comes second.
