---
'@pandacss/config': patch
---

Fix a false positive with the validation check that reported `Missing token` when using a color opacity modifier in
config `tokens` or `semanticTokens`

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  validation: 'warn',
  conditions: {
    light: '.light &',
    dark: '.dark &',
  },
  theme: {
    tokens: {
      colors: {
        blue: { 500: { value: 'blue' } },
        green: { 500: { value: 'green' } },
      },
      opacity: {
        half: { value: 0.5 },
      },
    },
    semanticTokens: {
      colors: {
        secondary: {
          value: {
            base: 'red',
            _light: '{colors.blue.500/32}',
            _dark: '{colors.green.500/half}',
          },
        },
      },
    },
  },
})
```

Would incorrectly report:

- [tokens] Missing token: `colors.green.500/half` used in `config.semanticTokens.colors.secondary`
- [tokens] Missing token: `colors.blue.500/32` used in `config.semanticTokens.colors.secondary`
