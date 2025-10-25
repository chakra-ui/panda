---
"@pandacss/parser": patch
---

refactor(parser): extract property classification logic into focused functions
Broken down the `processMap` function in `classify.ts` into three single-responsibility functions:

- **`handleConditionProperty()`**: Handles condition-specific classification (responsive/pseudo-class selectors)
- **`classifyProperty()`**: Resolves shorthands, detects token types, and tracks property-specific maps
- **`updatePropertyMaps()`**: Centralized tracking map updates

