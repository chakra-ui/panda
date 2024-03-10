---
'@pandacss/generator': patch
'@pandacss/fixture': patch
---

Change the `styled-system/token` JS token function to use raw value for semanticToken that do not have conditions other
than `base`

```ts
export default defineConfig({
  semanticTokens: {
    colors: {
      blue: { value: 'blue' },
      green: {
        value: {
          base: 'green',
          _dark: 'white',
        },
      },
      red: {
        value: {
          base: 'red',
        },
      },
    },
  },
})
```

This is the output of the `styled-system/token` JS token function:

```diff
const tokens = {
    "colors.blue": {
-     "value": "var(--colors-blue)",
+     "value": "blue",
      "variable": "var(--colors-blue)"
    },
    "colors.green": {
      "value": "var(--colors-green)",
      "variable": "var(--colors-green)"
    },
    "colors.red": {
-     "value": "var(--colors-red)",
+     "value": "red",
      "variable": "var(--colors-red)"
    },
}
```
