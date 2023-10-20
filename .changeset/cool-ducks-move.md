---
'@pandacss/generator': minor
'@pandacss/shared': minor
'@pandacss/node': minor
---

Improve support for styled element composition. This ensures that you can compose two styled elements together and the
styles will be merged correctly.

```jsx
const Box = styled('div', {
  base: {
    background: 'red.light',
    color: 'white',
  },
})

const ExtendedBox = styled(Box, {
  base: { background: 'red.dark' },
})

// <ExtendedBox> will have a background of `red.dark` and a color of `white`
```

**Limitation:** This feature does not allow compose mixed styled composition. A mixed styled composition happens when an
element is created from a cva/inline cva, and another created from a config recipe.

- CVA or Inline CVA + CVA or Inline CVA = ✅
- Config Recipe + Config Recipe = ✅
- CVA or Inline CVA + Config Recipe = ❌

```jsx
import { button } from '../styled-system/recipes'

const Button = styled('div', button)

// ❌ This will throw an error
const ExtendedButton = styled(Button, {
  base: { background: 'red.dark' },
})
```
