---
'@pandacss/eslint-plugin': patch
---

Add the ESLint plugin core (settings, project caching, inspection caching, source range lookup), the first Panda lint
rules (`extraction-diagnostics`, `file-not-included`, `no-invalid-token-paths`, `no-debug`, a consolidated
`no-deprecated` covering deprecated tokens, utilities, recipes, and patterns — with the author's deprecation message and
a `kinds` option, and `prefer-token`, which flags raw values where a token exists and tells you the token to use
(semantic tokens preferred, value forms normalized); `recommended` scopes it to colors, replacing v1's
`no-hardcoded-color`), and a `configs.recommended({ configPath })` flat-config entry with `@pandacss/*` rule ids. Config
and compiler loading is preloaded once per project so rule visitors stay synchronous.
