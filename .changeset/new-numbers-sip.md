---
'@pandacss/parser': patch
'@pandacss/core': patch
---

Simple conditions can now be combined just-in-time, without having to create a new one in the config file.

```tsx
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  conditions: {
    hover: '&:is(:hover, [data-hover])',
    disabled: '&:is(:disabled, [disabled], [data-disabled])',
  },
})

// src/app.tsx
import { css } from '../styled-system/css'

export const App = () => {
  return (
    <div
      className={css({
        color: 'red.600',
        '&_hover:not(_disabled)': {
          color: 'yellow.500',
        },
      })}
    >
      JIT conditions are pretty cool
    </div>
  )
}
```

This will generate a CSS file looking like this:

```css
@layer utilities {
  .c_red\.600 {
    color: var(--colors-red-600);
  }

  .\[\&_hover\:not\(_disabled\)\]\:c_yellow\.500.\[\&_hover\:not\(_disabled\)\]\:c_yellow\.500:is(
      :hover,
      [data-hover]
    ):not(.\[\&_hover\:not\(_disabled\)\]\:c_yellow\.500:is(:disabled, [disabled], [data-disabled])) {
    color: var(--colors-yellow-500);
  }
}
```
