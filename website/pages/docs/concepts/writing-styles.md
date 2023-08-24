---
title: Writing Styles
description: Panda generates the utilities you need to style your components with confidence.
---

# Writing Styles

Using the object syntax is a fundamental approach to writing styles in Panda. It not only provides a type-safe style authoring experience, but also improves readability and ensures a consistent experience with style overrides.

## Atomic Styles

When you write styles in Panda, it generates a modern atomic stylesheet that is automatically scoped to the `@layer utilities` cascade layer.

The atomic stylesheets approach offers several advantages, such as improved code maintainability and reusability, as well as a smaller overall CSS footprint.

Panda exposes a `css` function that can be used to author styles. It accepts a style object and returns a className string.

```jsx
import { css } from '../styled-system/css'

const styles = css({
  backgroundColor: 'gainsboro',
  borderRadius: '9999px',
  fontSize: '13px',
  padding: '10px 15px'
})

// Generated className:
// --> bg_gainsboro rounded_9999px fs_13px p_10px_15px

<div className={styles}>
  <p>Hello World</p>
</div>
```

The styles generated at build time end up like this:

```css
@layer utilities {
  .bg_gainsboro {
    background-color: gainsboro;
  }

  .rounded_9999px {
    border-radius: 9999px;
  }

  .fs_13px {
    font-size: 13px;
  }

  .p_10px_15px {
    padding: 10px 15px;
  }
}
```

### Shorthand Properties

Panda provides shorthands for common css properties to help improve the speed of development and reduce the visual density of your style declarations.

Properties like `borderRadius`, `backgroundColor`, and `padding` can be swapped to their shorthand equivalent `rounded`, `bg`, and `p`.

```jsx
// BEFORE - Good
const styles = css({
  backgroundColor: 'gainsboro',
  borderRadius: '9999px',
  fontSize: '13px',
  padding: '10px 15px'
})

// AFTER - Better
const styles = css({
  bg: 'gainsboro',
  rounded: '9999px',
  fontSize: '13px',
  p: '10px 15px'
})
```

### Type safety

Panda is built with TypeScript and provides type safety for all style properties and shorthands. Most of the style properties are connected to either the native CSS properties or their respective token value defined as defined in the `theme` object.

```ts
//                       ⤵ you'll get autocomplete for colors
const styles = css({ bg: '|' })
```

> You can also enable the `strictTokens: true` setting in the Panda configuration. This allows only token values and prevents the use of custom or raw CSS values.

### Numeric values

If you use React, you might be familar with the fact that it auto-converts some CSS properties to "px".

**Panda does not auto convert numeric values** and requires that you use "px" when needed. This also helps to differentiate between token values and raw CSS values.

```jsx
import { css } from '../styled-system/css'

// ❌ Won't work
const styles = css({
  fontSize: 13,
  paddingTop: 10
})

// ✅ Works
const styles = css({
  fontSize: '13px',
  paddingTop: '10px'
})
```

## Nested Styles

Panda provides different ways of nesting style declarations. You can use the native css nesting syntax, or the built-in pseudo props like `_hover` and `_focus`. Pseudo props are covered more in-depth in the next section.

### Native CSS Nesting

Panda supports the native css nesting syntax. You can use the `&` selector to create nested styles.

> **Important:** It is required to use the "&" character when nesting styles.

```jsx
<div
  className={css({
    bg: 'red.400',
    '&:hover': {
      bg: 'orange.400'
    }
  })}
/>
```

You can also target children and siblings using the `&` syntax.

```jsx
<div
  className={css({
    bg: 'red.400',
    '& span': {
      color: 'pink.400'
    }
  })}
/>
```

We recommend not using descendant selectors as they can lead to specificity issues when managing style overrides. Colocating styles directly on the element is the preferred way of writing styles in Panda.

### Using Pseudo Props

Panda provides a set of pseudo props that can be used to create nested styles. The pseudo props are prefixed with an underscore `_` to avoid conflicts with the native pseudo selectors.

For example, to create a hover style, you can use the `_hover` pseudo prop.

```jsx
<div
  className={css({
    bg: 'red.400',
    _hover: {
      bg: 'orange.400'
    }
  })}
/>
```

> See the [pseudo props](/docs/concepts/conditional-styles#reference) section for a list of all available pseudo props.

## Global styles

Sometimes you might want to insert global css like adding additional resets or font faces. Global styles in Panda can be added to the `panda.config.ts` using the `globalCss` property.

```js filename="panda.config.ts"
import { defineConfig, defineGlobalStyles } from '@pandacss/dev'

const globalCss = defineGlobalStyles({
  'html, body': {
    color: 'gray.900',
    lineHeight: '1.5'
  }
})

export default defineConfig({
  // ...
  globalCss
})
```

Global styles are inserted at the top of the stylesheet and are scoped to the `@layer base` cascade layer.

The styles generated at build time will look like this:

```css
@layer base {
  html,
  body {
    color: var(--colors-gray-900);
    line-height: 1.5;
  }
}
```

## Managing Classnames

### Merging

Panda provides a `cx` function to manage classnames. It accepts a list of classnames and returns a string.

```jsx
import { css, cx } from '../styled-system/css'

const styles = css({
  borderWidth: '1px',
  borderRadius: '8px',
  paddingX: '12px',
  paddingY: '24px'
})

const Card = ({ className, ...props }) => {
  const rootClassName = cx('group', styles, className)
  return <div className={rootClassName} {...props} />
}
```

### Overriding

Passing multiple styles to the `css` function will merge the styles together. This allows you to override styles in a predictable way.

```jsx
import { css } from '../styled-system/css'

const result = css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })
//    ^? result = "mx_10 pt_6"
```

If you intend for your components to have overridable styles, rather than passing
the result of the `css` function as props, you should pass the style objects using the `raw` functions and just call the
`css` function in the component itself.

Example:

```tsx title="src/components/Button.tsx"
'use client'
import * as React from 'react'
import { flex } from '../../styled-system/patterns'
import { css, cva } from '../../styled-system/css'
import { SystemStyleObject } from '../../styled-system/types'

export function Button(
  props: React.ComponentPropsWithoutRef<'button'> & { css?: SystemStyleObject }
) {
  const flexProps = flex.raw({
    direction: 'row',
    _hover: { color: 'blue.400' },
    border: '1px solid'
  })
  const rootStyle = css(flexProps, props.css ?? {})
  return <button className={rootStyle}>{props.children}</button>
}

const thing = cva({
  base: { display: 'flex', fontSize: 'lg' },
  variants: {
    variant: {
      primary: { color: 'white', backgroundColor: 'blue.500' }
    }
  }
})

export const Thingy = (
  props: React.ComponentPropsWithoutRef<'button'> & { css?: SystemStyleObject }
) => {
  const rootStyle = css(
    thing.raw({ variant: 'primary' }),
    css.raw({ _hover: { color: 'blue.400' } }),
    props.css ?? {}
  )
  return <button className={rootStyle}>{props.children}</button>
}
```

```tsx title="src/app/page.tsx"
import { css } from '../../styled-system/css'
import { Button, Thingy } from './Button'

export default function Home() {
  return (
    <>
      <Button css={css.raw({ display: 'block', _hover: { color: 'red' } })}>
        Client component button with pattern
        <span>
          will result in `class="d_block flex_row hover:text_red
          border_1px_solid"`
        </span>
      </Button>
      <Thingy css={css.raw({ display: 'block', _hover: { color: 'yellow' } })}>
        Client component button with recipe
        <span>
          will result in `class="d_block fs_lg text_white bg_blue.500
          hover:text_yellow"`
        </span>
      </Thingy>
    </>
  )
}
```

### Hashing

When debugging or previewing DOM elements in the browser, the length of the generated atomic `className` can get quite long, and a bit annoying. If you prefer to have terser classnames, use the `hash` option to enable className and css variable name hashing.

```ts filename="panda.config.ts"
export default defineConfig({
  // ...
  hash: true
})
```

> You might need to generate a new code artifact by running `panda codegen --clean`

When you write a style like this:

```jsx
import { css } from '../styled-system/css'

const styles = css({
  display: 'flex',
  flexDirection: 'row',
  _hover: {
    bg: 'red.50'
  }
})
```

The hash generated classnames will look like:

```css
.dsf3wd {
  display: flex;
}

.kdi9jd {
  flex-direction: row;
}

.mdf4jd:hover {
  background-color: var(--colors-red-50);
}
```

> We recommend that you use this in production builds only, as it can make debugging a bit harder.

## Important styles

Applying important styles works just like CSS

```js
css({
  color: 'red !important'
})
```

You can also apply important using just the exclamation syntax `!`

```js
css({
  color: 'red!'
})
```

## TypeScript

Use the `SystemStyleObject` type if you want to type your styles.

```ts {2}
import { css } from '../styled-system/css'
import type { SystemStyleObject } from '../styled-system/types'

const styles: SystemStyleObject = {
  color: 'red'
}
```
