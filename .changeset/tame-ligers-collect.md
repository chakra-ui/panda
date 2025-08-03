---
'@pandacss/astro-plugin-studio': major
'@pandacss/dev': major
'@pandacss/config': major
'@pandacss/core': major
'@pandacss/extractor': major
'@pandacss/generator': major
'@pandacss/is-valid-prop': major
'@pandacss/logger': major
'@pandacss/node': major
'@pandacss/parser': major
'@pandacss/postcss': major
'@pandacss/preset-atlaskit': major
'@pandacss/preset-base': major
'@pandacss/preset-open-props': major
'@pandacss/preset-panda': major
'@pandacss/reporter': major
'@pandacss/shared': major
'@pandacss/studio': major
'@pandacss/token-dictionary': major
'@pandacss/types': major
---

Stable release of PandaCSS

### Style Context

Add `createStyleContext` function to framework artifacts for React, Preact, Solid, and Vue frameworks

```tsx
import { sva } from 'styled-system/css'
import { createStyleContext } from 'styled-system/jsx'

const card = sva({
  slots: ['root', 'label'],
  base: {
    root: {
      color: 'red',
      bg: 'red.300',
    },
    label: {
      fontWeight: 'medium',
    },
  },
  variants: {
    size: {
      sm: {
        root: {
          padding: '10px',
        },
      },
      md: {
        root: {
          padding: '20px',
        },
      },
    },
  },
  defaultVariants: {
    size: 'sm',
  },
})

const { withProvider, withContext } = createStyleContext(card)

const CardRoot = withProvider('div', 'root')
const CardLabel = withContext('label', 'label')
```

Then, use like this:

```tsx
<CardRoot size="sm">
  <CardLabel>Hello</CardLabel>
</CardRoot>
```
