---
'@pandacss/compiler': patch
---

Fixed issue where a nested `DEFAULT` in `textStyles`, `layerStyles`, or `animationStyles` wasn't reachable through its
parent key, so `textStyle: 'body'` emitted no CSS and the type listed `"body.DEFAULT"` instead of `"body"`.
