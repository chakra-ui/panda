---
'@pandacss/types': patch
'@pandacss/config': patch
---

Fix the `preset:resolved` hook missing its `utils` argument. Plugin authors can now use `omit` / `pick` / `traverse`
inside `preset:resolved` (matching `config:resolved` and v1).
