---
'@pandacss/preset-base': patch
---

Fix `Spacer` pattern not resolving spacing tokens for the `size` prop.

Previously, `<Spacer size="5" />` would generate invalid CSS (`flex: 0 0 5`) instead of resolving the spacing token. Now
it correctly outputs `flex: 0 0 var(--spacing-5, 5)`.

**Before (broken):** `flex: 0 0 5` — raw value, not a valid CSS length **After (fixed):**
`flex: 0 0 var(--spacing-5, 5)` — resolved spacing token

Closes #3490
