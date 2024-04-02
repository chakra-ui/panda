---
'@pandacss/token-dictionary': patch
'@pandacss/studio': patch
---

Public changes: Some quality of life fixes for the Studio:

- Handle displaying values using the `[xxx]` escape-hatch syntax for `textStyles` in the studio
- Display an empty state when there's no token in a specific token page in the studio

---

(mostly) Internal changes:

- Add `deepResolveReference` in TokenDictionary, helpful to get the raw value from a semantic token by recursively
  traversing the token references.
- Added some exports in the `@pandacss/token-dictionary` package, mostly useful when building tooling around Panda
  (Prettier/ESLint/VSCode plugin etc)
