---
'@pandacss/compiler': patch
---

Under `strictTokens`, empty token categories still accept native CSS keywords. `cursor: 'pointer'` works without the `[pointer]` escape hatch; same for utilities like `opacity` and `zIndex` with no tokens defined.
