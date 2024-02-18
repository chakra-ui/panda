---
'@pandacss/config': patch
---

Expose utility functions in `@pandacss/dev/utils` that mirror the ones available in the `config:resolved` hook. This
allows easily transforming a preset before merging it with the user's configuration.

In the following example, we remove every colors from the built-in `@pandacss/preset-panda` so that only the custom
preset's colors will be remaining, while keeping everything else from the built-in preset.

```ts
import { definePreset, defineConfig } from '@pandacss/dev'
import _pandaPreset from '@pandacss/dev/presets'
import { omit } from '@pandacss/dev/utils'

const pandaPreset = omit(_pandaPreset, ['theme.tokens.colors', 'theme.semanticTokens.colors'])

const myPreset = definePreset({
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          accent: {
            5: { value: '{colors.green.500}' },
          },
        },
      },
      tokens: {
        colors: {
          green: {
            500: { value: '#0f0' },
          },
        },
      },
    },
  },
})

export default defineConfig({
  // ...
  presets: [pandaPreset, myPreset],
})
```
