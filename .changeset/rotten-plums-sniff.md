---
'@pandacss/preset-panda': minor
'@pandacss/generator': minor
'@pandacss/types': minor
'@pandacss/core': minor
'@pandacss/dev': minor
---

Add support for animation styles. Animation styles focus solely on animations, allowing you to orchestrate animation
properties.

> Pairing animation styles with text styles and layer styles can make your styles a lot cleaner.

Here's an example of this:

```jsx
import { defineAnimationStyles } from '@pandacss/dev'

export const animationStyles = defineAnimationStyles({
  'slide-fade-in': {
    value: {
      transformOrigin: 'var(--transform-origin)',
      animationDuration: 'fast',
      '&[data-placement^=top]': {
        animationName: 'slide-from-top, fade-in',
      },
      '&[data-placement^=bottom]': {
        animationName: 'slide-from-bottom, fade-in',
      },
      '&[data-placement^=left]': {
        animationName: 'slide-from-left, fade-in',
      },
      '&[data-placement^=right]': {
        animationName: 'slide-from-right, fade-in',
      },
    },
  },
})
```

With that defined, I can use it in my recipe or css like so:

```js
export const popoverSlotRecipe = defineSlotRecipe({
  slots: anatomy.keys(),
  base: {
    content: {
      _open: {
        animationStyle: 'scale-fade-in',
      },
      _closed: {
        animationStyle: 'scale-fade-out',
      },
    },
  },
})
```

This feature will drive consumers to lean in towards CSS for animations rather than JS. Composing animation names is a
powerful feature we should encourage consumers to use.
