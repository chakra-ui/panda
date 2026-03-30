---
'@pandacss/generator': patch
'@pandacss/types': patch
---

Add support for generating theme tokens in `panda spec` output.

Previously, tokens defined in the `themes` config were excluded from the spec output because they are registered as virtual tokens. Now, `panda spec` generates a `themes.json` file containing tokens and semantic tokens for each configured theme.
