---
'@pandacss/eslint-plugin': patch
---

Add the first Panda ESLint rules and a recommended flat config.

The plugin now checks extraction diagnostics, included files, token paths, deprecated Panda APIs, raw values that should
use tokens, shorthand/longhand conflicts, property naming style, invalid nesting, and debug calls. The same rules are
also exposed for oxlint through `@pandacss/eslint-plugin/oxlint`.
