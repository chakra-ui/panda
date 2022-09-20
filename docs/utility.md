## Utilities API

This provides an interface to:

- Map css properties to classNames (that appear in the DOM)
- Make your own custom css properties and transform them to css objects
- Map css properties to design tokens

### Add utility

Let's say you want to provide a custom `bg` css property, here's how you'll do it:

```js
import { defineUtility } from 'css-panda'

const bg = defineUtility({
  // the className in the DOM
  className: 'bg',
  // get the values of bg from color tokens
  values: 'colors',
  // convert value to css objects
  transform(value) {
    return {
      background: value,
    }
  },
})
```
