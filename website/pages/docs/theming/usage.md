---
title: Using Tokens
description: There are various ways to consume Panda tokens depending on your need at that point in time.
---

# Using Tokens

There are various ways to consume Panda tokens depending on your need at that point in time.

## Style Properties

The recommended way to consume your tokens is in the `css` function or style props.

```jsx
import { css } from '../styled-system/css'

const App = () => (
  <div
    className={css({
      color: 'green.400',
      background: 'gray.200'
    })}
  />
)
```

## Composite values

Some CSS properties like `border`, `box-shadow` allow you to specify multiple properties in its value. Panda allows you to reference tokens in these composite values by using the `token()` function.

```js
import { css } from '../styled-system/css'

const className = css({ border: '1px solid token(colors.red.400)' })
```

You can also provide a fallback value.

```js
import { css } from '../styled-system/css'

const className = css({ border: '1px solid token(colors.red.400, red)' })
```

You can also use it in media queries or any other CSS at-rule.

```js
import { css } from '../styled-system/css'

const className = css({
  '@media screen and (min-width: token(sizes.4xl))': {
    color: 'green.400'
  }
})
```

## Vanilla JS

Use the generated `token` function to query design tokens in your project. This is useful if you need direct access to your design tokens in the `style` attribute or when using CSS-in-JS libraries like `styled-components` or `@emotion/styled`

> This approach is useful for incrementally adopting Panda in existing projects.

### Style Attribute

```tsx
import { token } from '../styled-system/tokens'

function App() {
  return (
    <div
      style={{
        background: token('colors.blue.200')
      }}
    />
  )
}
```

Each of your design tokens will be available in the generated `/tokens` folder. It looks like this:

```js
const tokens = {
  // ...
  'colors.blue.200': {
    value: '#bfdbfe',
    variable: 'var(--colors-blue-200)'
  }
  // ...
}
```

- The `token()` function returns the raw value of the token.
- The `token.var()` function returns the CSS custom property used to reference the token.

Both functions are typesafe and expect a known dot-separated token path, they also accept a fallback value as a second
argument.

Using the example above, `token('colors.blue.200')` would return `#bfdbfe` and `token.var('colors.blue.200')` would
return `var(--colors-blue-200)`.

### Styled Components

```tsx
import styled from 'styled-components'

const Button = styled.button`
  background: ${token('colors.blue.200')};
`
```

### Emotion

```tsx
import styled from '@emotion/styled'

const Button = styled.button`
  background: ${token('colors.blue.200')};
`
```
