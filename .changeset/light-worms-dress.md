---
'@pandacss/token-dictionary': patch
'@pandacss/parser': patch
---

Using colorPalette with DEFAULT values will now also override the current token path

Given this config:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          bg: {
            primary: {
              DEFAULT: {
                value: '{colors.red.500}',
              },
              base: {
                value: '{colors.green.500}',
              },
              hover: {
                value: '{colors.yellow.300}',
              },
            },
          },
        },
      },
    },
  },
})
```

And this style usage:

```ts
import { css } from 'styled-system/css'

css({
  colorPalette: 'bg.primary',
})
```

This is the difference in the generated css

```diff
@layer utilities {
  .color-palette_bg\\.primary {
+    --colors-color-palette: var(--colors-bg-primary);
    --colors-color-palette-base: var(--colors-bg-primary-base);
    --colors-color-palette-hover: var(--colors-bg-primary-hover);
  }
}
```

Which means you can now directly reference the current `colorPalette` like:

```diff
import { css } from 'styled-system/css'

css({
  colorPalette: 'bg.primary',
+  backgroundColor: 'colorPalette',
})
```
