---
'@pandacss/config': patch
---

Fix merging issue when using a preset that has a token with a conflicting value with another (or the user's config)

```ts
import { defineConfig } from '@pandacss/dev'

const userConfig = defineConfig({
  presets: [
    {
      theme: {
        extend: {
          tokens: {
            colors: {
              black: { value: 'black' },
            },
          },
        },
      },
    },
  ],
  theme: {
    tokens: {
      colors: {
        black: {
          0: { value: 'black' },
          10: { value: 'black/10' },
          20: { value: 'black/20' },
          30: { value: 'black/30' },
        },
      },
    },
  },
})
```

When merged with the preset, the config would create nested tokens (`black.10`, `black.20`, `black.30`) inside of the
initially flat `black` token.

This would cause issues as the token engine stops diving deeper after encountering an object with a `value` property.

To fix this, we now automatically replace the flat `black` token using the `DEFAULT` keyword when resolving the config
so that the token engine can continue to dive deeper into the object:

```diff
{
  "theme": {
    "tokens": {
      "colors": {
        "black": {
          "0": {
            "value": "black",
          },
          "10": {
            "value": "black/10",
          },
          "20": {
            "value": "black/20",
          },
          "30": {
            "value": "black/30",
          },
-          "value": "black",
+          "DEFAULT": {
+            "value": "black",
+          },
        },
      },
    },
  },
}
```
