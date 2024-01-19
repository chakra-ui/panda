---
'@pandacss/core': patch
---

Fix a regression with rule insertion order after triggering HMR that re-uses some CSS already generated in previous
triggers, introuced in v0.27.0
