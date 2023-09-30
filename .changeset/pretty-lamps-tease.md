---
'@pandacss/generator': patch
'@pandacss/node': patch
---

- Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`
