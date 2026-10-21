---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Fix styles not applying when a value has extra spaces or tabs inside quotes, such as `gridTemplateAreas`. The class on
the element now matches the generated CSS, and quoted text keeps its spacing.

```ts
css({ gridTemplateAreas: `"col1  col2" "col3 col4"` })
```
