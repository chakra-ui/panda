---
'@pandacss/generator': patch
'@pandacss/parser': patch
---

Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal parsing
when not using `config.syntax` set to "template-literal"
