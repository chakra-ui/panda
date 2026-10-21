---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Source transforms now compile a recipe kept in a local object, like `const styles = { button: cva({ ... }) }`, to a
plain function when it's only called (`styles.button(...)`). Its config no longer ships in the bundle.

Type-only references, like `RecipeVariantProps<typeof styles.button>`, no longer keep a recipe's config either.
