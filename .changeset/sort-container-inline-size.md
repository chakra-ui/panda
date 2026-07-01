---
'@pandacss/compiler': patch
---

Sort container queries by their resolved size, like media queries.

Theme container conditions that emit `@container (inline-size >= …)` now keep the expected mobile-first cascade order.
