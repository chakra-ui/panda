---
'@pandacss/extractor': minor
'@pandacss/generator': minor
'@pandacss/parser': minor
'@pandacss/shared': minor
'@pandacss/types': minor
---

Add support for tagged template literal version.

This features is pure css approach to writing styles, and can be a great way to migrate from styled-components and
emotion.

Set the `syntax` option to `template-literal` in the panda config to enable this feature.

```js
// panda.config.ts
export default defineConfig({
  //...
  syntax: 'template-literal',
})
```

> For existing projects, you might need to run the `panda codegen --clean`

You can also use the `--syntax` option to specify the syntax type when using the CLI.

```sh
panda init -p --syntax template-literal
```

To get autocomplete for token variables, consider using the
[CSS Var Autocomplete](https://marketplace.visualstudio.com/items?itemName=phoenisx.cssvar) extension.
