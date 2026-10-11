---
'@pandacss/eslint-plugin': patch
---

Fix `recommended()` failing to type-check in `eslint.config.ts` (TS2322), so the config no longer needs a cast. A
diagnostic without a source location is now reported on line 1 instead of making ESLint throw.
