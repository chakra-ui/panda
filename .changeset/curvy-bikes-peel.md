---
'@pandacss/token-dictionary': patch
'@pandacss/core': patch
---

Allow using the color opacity modifier syntax (`blue.300/70`) in token references:

- `{colors.blue.300/70}`
- `token(colors.blue.300/70)`

Note that this works both in style usage and in build-time config.

```ts
// runtime usage

import { css } from '../styled-system/css'

css({ bg: '{colors.blue.300/70}' })
// => @layer utilities {
//    .bg_token\(colors\.blue\.300\/70\) {
//      background: color-mix(in srgb, var(--colors-blue-300) 70%, transparent);
//    }
//  }

css({ bg: 'token(colors.blue.300/70)' })
// => @layer utilities {
//    .bg_token\(colors\.blue\.300\/70\) {
//      background: color-mix(in srgb, var(--colors-blue-300) 70%, transparent);
//    }
//  }
```

```ts
// build-time usage
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    tokens: {
      colors: {
        blue: {
          300: { value: '#00f' },
        },
      },
    },
    semanticTokens: {
      colors: {
        primary: {
          value: '{colors.blue.300/70}',
        },
      },
    },
  },
})
```

```css
@layer tokens {
  :where(:root, :host) {
    --colors-blue-300: #00f;
    --colors-primary: color-mix(in srgb, var(--colors-blue-300) 70%, transparent);
  }
}
```
