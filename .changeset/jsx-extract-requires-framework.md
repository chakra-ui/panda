---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Only extract JSX style props when `jsxFramework` is configured.

This prevents CSS from being generated for JSX components in projects that have not enabled JSX extraction. Function-call extraction is unchanged.
