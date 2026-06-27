---
'@pandacss/compiler': patch
---

Fix narrower border shorthands losing the cascade to the all-sides `borderColor`/`borderStyle`/`borderWidth` shorthands. Per-side shorthands (`borderInlineEnd`, `borderTop`, …) and axis-pair shorthands (`borderInlineColor`, `borderBlockWidth`, …) were emitted before the all-sides ones, which then re-applied the border — so `borderEnd: 0` could no longer remove that side. They now sort after the all-sides shorthands, so the narrower property wins, matching v1.
