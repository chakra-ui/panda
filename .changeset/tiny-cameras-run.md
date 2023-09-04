---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/shared': patch
'@pandacss/studio': patch
---

Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when using `Regex`
in the `jsx` field of a config, resulting in some style props missing.

issue: https://github.com/chakra-ui/panda/issues/1315
