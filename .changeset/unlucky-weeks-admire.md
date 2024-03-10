---
'@pandacss/generator': patch
'@pandacss/types': patch
---

Add an optional `className` key in `sva` config which will can be used to target slots in the DOM.

Each slot will contain a `${className}__${slotName}` class in addition to the atomic styles.

```tsx
import { sva } from '../styled-system/css'

const button = sva({
  className: 'btn',
  slots: ['root', 'text'],
  base: {
    root: {
      bg: 'blue.500',
      _hover: {
        // v--- 🎯 this will target the `text` slot
        '& .btn__text': {
          color: 'white',
        },
      },
    },
  },
})

export const App = () => {
  const classes = button()
  return (
    <div className={classes.root}>
      <div className={classes.text}>Click me</div>
    </div>
  )
}
```
