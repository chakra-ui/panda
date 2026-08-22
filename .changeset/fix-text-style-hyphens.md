---
"@pandacss/types": patch
---

Fix `TextStyleProperty` typo: `hypens` → `hyphens`

`hyphens` is the CSS property; the neighbouring `hyphenateCharacter` / `hyphenateLimitChars` keys were already spelled correctly. The misspelled key was the only one the type accepted, and codegen emitted invalid CSS `hypens: auto`.
