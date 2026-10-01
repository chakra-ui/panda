---
'@pandacss/compiler': patch
---

Fix token references in values, as in 1.x:

- `css({ '--offset': '{spacing.-2}' })` now emits `calc(var(--spacing-2) * -1)` instead of an empty rule.
- References like `{colors.red}` resolve even when the config has no utilities (no preset).
