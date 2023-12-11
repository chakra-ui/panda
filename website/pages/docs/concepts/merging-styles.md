---
title: Merging Styles
description: Learn how to merge multiple styles together in Panda CSS.
---

# Merging Styles

Panda CSS provides a few ways to efficiently merge styles together without conflicts.

## Merging `css` objects

You can merge multiple style objects together using the `css` function.

```js
import { css } from 'styled-system/css'

const style1 = {
  bg: 'red',
  color: 'white'
}

const style2 = {
  bg: 'blue'
}

const className = css(style1, style2) // => 'bg_blue text_white'
```

In some cases though, the style object might not be colocated in the same file as the component. In this case, you can use the `css.raw` function to preserve the original style object.

> All `.raw(...)` signatures are identity functions that return the same value as the input, but > serve as a hint to the compiler that the value is a style object.

```js
// style.js
import { css } from 'styled-system/css'

export const style1 = css.raw({
  bg: 'red',
  color: 'white'
})

// component.js
import { css } from 'styled-system/css'
import { style1 } from './style.js'

const style2 = css.raw({
  bg: 'blue'
})

const className = css(style1, style2) // => 'bg_blue text_white'
```

## Merging `cva` + `css` styles

The same technique can be used to merge an atomic `cva` recipe and a style object.

```js
import { css, cx, cva } from 'styled-system/css'

const overrideStyles = css.raw({
  bg: 'red',
  color: 'white'
})

const buttonStyles = cva({
  base: {
    bg: 'blue',
    border: '1px solid black'
  },
  variants: {
    size: {
      small: { fontSize: '12px' }
    }
  }
})

const className = css(
  // returns the resolved style object
  buttonStyles.raw({ size: 'small' }),
  // add the override styles
  overrideStyles
)

// => 'bg_red border_1px_solid_black color_white font-size_12px'
```

## Merging config recipe and style object

Due to the fact that the generated styles of a config recipe is saved in the `@layer recipe` cascade layer, they can overriden with any atomic styles. Use the `cx` function to achieve that.

> The `utilties` layer has more precedence than the `recipe` layer.

```js
import { css, cx } from 'styled-system/css'
import { button } from 'styled-system/recipes'

const className = cx(
  // returns the resolved class name: `button button--size-small`
  button({ size: 'small' }),
  // add the override styles
  css({ bg: 'red' }) // => 'bg_red'
)

// => 'button button--size-small bg_red'
```

## Merging within JSX component

Using these techniques, you can apply them to a component to merge styles together.

> Tip: Panda extracts the `css` prop from the JSX component

```jsx
const cardStyles = css({
  bg: 'red',
  color: 'white'
})

function Card({ title, description, css: cssProp }) {
  return (
    // merge the `cardStyles` with the `cssProp` passed in
    <div className={css(cardStyles, cssProp)}>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

// usage
function Demo() {
  return (
    <Card
      title="Hello World"
      description="This is a card component"
      css={{ bg: 'blue' }}
    />
  )
}
```

If you use any other prop name other than `css`, then you must use the `css.raw(...)` function to ensure Panda extracts the style object.

```jsx
const cardStyles = css.raw({
  bg: 'red',
  color: 'white'
})

function Card({ title, description, style }) {
  return (
    // merge the `cardStyles` with the `style` passed in
    <div className={css(cardStyles, style)}>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}

// usage
function Demo() {
  return (
    <Card
      title="Hello World"
      description="This is a card component"
      // use `css.raw(...)` to ensure Panda extracts the style object
      style={css.raw({ bg: 'blue' })}
    />
  )
}
```
