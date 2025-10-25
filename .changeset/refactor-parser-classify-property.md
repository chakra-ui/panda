---
"@pandacss/parser": patch
---

refactor(parser): extract property classification logic into focused functions

Improved code organization in `classify.ts` by decomposing the complex `processMap` function into three single-responsibility functions:

- **`handleConditionProperty()`**: Handles condition-specific classification (responsive/pseudo-class selectors)
- **`classifyProperty()`**: Resolves shorthands, detects token types, and tracks property-specific maps
- **`updatePropertyMaps()`**: Centralized tracking map updates

**Benefits:**
- Reduced `processMap` complexity from ~100 lines to ~47 lines
- Better separation of concerns following SRP
- Improved readability and maintainability
- Easier to test and debug individual responsibilities
- No behavioral changes - all existing tests pass (147/147)

**Preserved:**
- All TODOs and design decision comments
- Original logic flow and behavior
- No changes to external interfaces

