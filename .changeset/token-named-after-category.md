---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix tokens whose name starts with their own category, like `colors.grey50` under `colors`:

- Generated types now list `colors.grey50` instead of `grey50`, so the token type-checks under `strictTokens` and the raw name no longer does.
- `staticCss` wildcards on pattern props no longer cut nested token names short, like `red.500` becoming `500`.
