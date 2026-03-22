---
'@pandacss/token-dictionary': patch
---

Fix duplicate token references with special characters resolving incorrectly in composite values

When the same token reference containing special characters (e.g. `{sizes.0.5}`) appeared more than once in a composite value, only the first occurrence was resolved correctly. The second occurrence produced a malformed CSS variable name.

This was caused by `String.replace()` only replacing the first match. Changed to `String.replaceAll()` in `Token.expandReferences()` and `expandReferences()` utility.

**Before (broken):**
`--shadows-control-accent: 0 var(--sizes-0\.5) var(--sizes-0-5) rgba(92, 225, 113, 0.25)`

**After (fixed):**
`--shadows-control-accent: 0 var(--sizes-0\.5) var(--sizes-0\.5) rgba(92, 225, 113, 0.25)`
