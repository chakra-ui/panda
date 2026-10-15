---
'@pandacss/eslint-plugin': patch
'@pandacss/compiler': patch
---

Report missing token references inside style values through `no-invalid-token-paths` and `panda cssgen`, with source locations. Recipe metadata and variant selectors are excluded, while style rules like `prefer-token` also check pattern props.
