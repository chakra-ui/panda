---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Remove `pure_helper_unevaluated` warnings, which could fail builds even when the selected styles were fully extracted.
Fix duplicate `deprecated_token_used` warnings for the same token call.
