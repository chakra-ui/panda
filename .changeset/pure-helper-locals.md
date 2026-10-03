---
'@pandacss/compiler': patch
'@pandacss/compiler-wasm': patch
---

Style helpers can now destructure their parameters, declare local `const` / `let` values, spread objects, and call other
helpers, and Panda still extracts their styles. A helper Panda can't evaluate now warns with `pure_helper_unevaluated`
instead of silently skipping its styles.

Default values of parameters and destructured props, like `function Button({ size = 'md' })`, generate CSS again.
