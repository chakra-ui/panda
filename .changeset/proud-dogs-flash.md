---
'@pandacss/token-dictionary': patch
'@pandacss/generator': patch
---

Fix the color opacity modifier syntax for `semanticTokens` inside of conditions

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
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
            _light: '{colors.blue.500/32}', // <-- wasn't working as expected
            _dark: '{colors.green.500/half}',
          },
        },
      },
    },
  },
})
```

will now correctly generate the following CSS:

```css
@layer tokens {
  :where(:root, :host) {
    --colors-blue-500: blue;
    --colors-green-500: green;
    --opacity-half: 0.5;
    --colors-secondary: red;
  }

  .light {
    --colors-secondary: color-mix(in srgb, var(--colors-blue-500) 32%, transparent);
  }

  .dark {
    --colors-secondary: color-mix(in srgb, var(--colors-green-500) 50%, transparent);
  }
}
```
