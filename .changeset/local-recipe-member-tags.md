---
'@pandacss/compiler': patch
---

Fix recipe components like `<Card.Root>` getting no CSS when rendered in the same file that defines `Card`, such as one
built with `createSlotRecipeContext`.
