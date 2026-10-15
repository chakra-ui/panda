---
'@pandacss/eslint-plugin': patch
'@pandacss/compiler': patch
---

`no-invalid-token-paths` now reports missing tokens inside style values, like `'0 0 0 1px {colors.ghost}'` or `'calc(token(sizes.ghost) + 2px)'`, at the exact reference. `panda cssgen` now warns about them too (`unknown_token_reference`) instead of silently writing the path into the CSS.

Style rules like `prefer-token` now also check pattern props, such as `stack({ gap: '10px' })` and `<Stack gap="10px" />`.
