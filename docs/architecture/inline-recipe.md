Shareable Used once

- Size (only get what you use)?
- Conditional or not?
- Output css (single class, or atomic)

```css
.button--size-md {
}
```

```jsx
// v1

import { css } from 'panda/css'

const buttonStyle = {
  solid: css({}),
  outline: css({}),
}

const className = button[props.variant ? 'solid' : 'outline']

// v2

import { cssMap } from 'panda/css'

const buttonStyle = cssMap({
  solid: {},
  outline: {},
})

const className = buttonStyle(props.variant ? 'solid' : 'outline')

// v3 - Recipe look-alike
// static recipe, (experimental)

import { inlineRecipe } from 'panda/recipes'

// cannot be responsive or conditional
const buttonStyle = inlineRecipe({
  base: {},
  variants: {},
  defaultVariants: {},
})

const className = buttonStyle({ variant: 'solid' }) // mt-5 md:m5
```
