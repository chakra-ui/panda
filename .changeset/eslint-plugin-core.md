---
'@pandacss/eslint-plugin': patch
---

Add the ESLint plugin core (settings, project caching, inspection caching, source range lookup), the first Panda lint
rules (`extraction-diagnostics`, `file-not-included`, `no-invalid-token-paths`, `no-debug`, `no-hardcoded-color`, and a
consolidated `no-deprecated` covering deprecated tokens, utilities, recipes, and patterns — with the author's
deprecation message and a `kinds` option; token detection covers `token()`, bare values, conditions, arrays, and
`/opacity` modifiers), and a `configs.recommended({ configPath })` flat-config entry with `@pandacss/*` rule ids.
Config and compiler loading is preloaded once per project so rule visitors stay synchronous.
