---
"@pandacss/core": patch
"@pandacss/generator": patch
---

- Fix an issue where recipe variants that clash with utility shorthand don't get generated due to the normalization that happens internally.
- Fix issue where Preact JSX types are not merging recipes correctly
