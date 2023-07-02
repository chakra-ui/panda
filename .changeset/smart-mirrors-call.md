---
'@pandacss/generator': patch
---

Fix reset.css (generated when config has `preflight: true`) import order, always place it first so that it can be easily
overriden
