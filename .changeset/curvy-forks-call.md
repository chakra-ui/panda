---
'@pandacss/generator': patch
'@pandacss/studio': patch
'@pandacss/types': patch
---

Add a `RecipeVariant` type to get the variants in a strict object from `cva` function. This complements the
`RecipeVariantprops` type that extracts the variant as optional props, mostly intended for JSX components.
