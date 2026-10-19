---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Source transforms now compile a `cva()` or `sva()` stored in a local object, like
`const styles = { button: cva({ ... }) }`, to a plain function when it is only ever called as `styles.button(...)`.
Before, these recipes kept their whole config and recipe surface in the bundle. A `typeof` reference in a type, like
`RecipeVariantProps<typeof styles.button>`, no longer counts as a use either.
