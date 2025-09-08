---
title: Migrating from Theme UI
description: Migrate your project from Theme UI to Panda.
---

# Migrating from Theme UI

This guide outlines the steps needed to migrate your project from Theme UI to Panda, and some design differences between the two libraries.

Here are some similarities between the two libraries.

- Panda and Theme UI both support JSX style props.
- Supports design tokens and themes.
- Support for styling primitives like `Box`, `Flex`, `Grid`, etc.

Below are some of the differences between the two libraries.

## Performance

Theme UI relies on `@emotion/styled` to style components. This means that every time you use the `sx` prop, runtime CSS-in-JS is required to compute the styles in the browser. This can lead to performance issues in larger applications.

Panda relies on `postcss` and converts CSS-in-JS styles to static CSS at build-time, leading to better performance in larger applications.

## Theming

In Theme UI, you need to wrap your application in a `ThemeProvider` component which is a wrapper around `@emotion/react` theme context.

```jsx
import { ThemeProvider } from 'theme-ui'

const theme = {
  fonts: {
    body: 'system-ui, sans-serif',
    heading: '"Avenir Next", sans-serif'
  },
  colors: {
    text: '#000',
    background: '#fff'
  }
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

In Panda, you don't need to wrap your application in a `ThemeProvider` component. Instead, you can pass the theme object to the `panda.config.js` file.

The theme object in Panda is broken down into multiple parts, `tokens` and `semanticTokens`. The theme specification also required passing the tokens as `{ value: XX }`

```js
// panda.config.js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      tokens: {
        fonts: {
          body: { value: 'system-ui, sans-serif' },
          heading: { value: '"Avenir Next", sans-serif' }
        },
        colors: {
          text: { value: '#000' },
          background: { value: '#fff' }
        }
      }
    }
  }
})
```

## The `sx` prop

In Theme UI, you can use the `sx` prop to style any component when you add the `jsxImportSource` pragma to the top of your file.

```jsx
/** @jsxImportSource theme-ui */

export const Demo = props => (
  <div
    {...props}
    sx={{
      color: 'white',
      bg: 'primary',
      fontSize: 4
    }}
  />
)
```

Panda offers three similar ways to style components. The first approach is to use the `styled` element syntax and rename `sx` to `css`

```jsx
import { styled } from 'styled-system/jsx'

export const Demo = props => (
  <styled.div
    {...props}
    css={{
      color: 'white',
      bg: 'primary',
      fontSize: 4
    }}
  />
)
```

The second approach is to create styled components using the `styled` function. This approach allows you to create style variants.

```jsx
import { styled } from 'styled-system/jsx'

export const Demo = styled('div', {
  base: {
    color: 'white',
    bg: 'primary',
    fontSize: 4
  }
})
```

The simplest approach is to use the `css` function to write one-off styles.

```jsx
import { css } from 'styled-system/css'

export const Demo = props => (
  <div
    {...props}
    className={css({
      color: 'white',
      bg: 'primary',
      fontSize: 4
    })}
  />
)
```

## Variants

In Theme UI, variants are used to create groups of styles based on the theme. It offers variant groups in the theme for several components.

- `Grid` maps to `theme.grids`
- `Button`, `IconButton` maps to `theme.buttons`
- `NavLink`, `Link` maps to `theme.links`
- `Input`, `Select`, `Textarea` maps to `theme.forms`
- `Heading`, `Text` maps to `theme.text`

```js
// theme.js

export default {
  colors: {
    primary: '#07c',
    secondary: '#30c',
    accent: '#609'
  },
  buttons: {
    primary: {
      color: 'white',
      bg: 'primary'
    },
    secondary: {
      color: 'white',
      bg: 'secondary'
    },
    accent: {
      color: 'white',
      bg: 'accent'
    }
  }
}

// Button.js
<button sx={{ variant: 'buttons.primary' }} />
```

In Panda, multi-variant styles are referred to as recipes. Recipes are a collection of styles that can be applied to any component.

There are two ways to define recipes in Panda. The first approach is to use the `cva` function which produces atomic classnames.

```js
import { cva } from 'styled-system/css'

const buttonStyles = cva({
  base: {
    display: 'inline-flex'
  },
  variants: {
    variant: {
      primary: {
        color: 'white',
        bg: 'primary'
      },
      secondary: {
        color: 'white',
        bg: 'secondary'
      },
      accent: {
        color: 'white',
        bg: 'accent'
      }
    }
  }
})

const Demo = () => (
  <button
    className={buttonStyles({
      variant: 'accent'
    })}
  />
)
```

The second approach is to define the recipe in the `theme.recipes` property of the panda config. This is referred to as 'Config recipes' in Panda and allows for sharing recipes across components and projects.

```js
// panda.config.js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      recipes: {
        button: {
          className: 'button',
          base: { display: 'inline-flex' },
          variants: {
            variant: {
              primary: { color: 'white', bg: 'primary' },
              secondary: { color: 'white', bg: 'secondary' },
              accent: { color: 'white', bg: 'accent' }
            }
          }
        }
      }
    }
  }
})

// Button.js
import { button } from 'styled-system/recipes'

const Demo = () => <button className={button({ variant: 'accent' })} />
```

## Color Modes

In Theme UI, colors modes can be used to create a user-configurable light and dark mode values that are automatically applied to components depending on color mode.

```jsx
// theme.js
const theme = {
  colors: {
    primary: '#07c',
    modes: {
      dark: {
        primary: '#0cf'
      }
    }
  }
}

// Button.js
const Demo = () => <button sx={{ color: 'primary' }} />
```

In Panda, color modes related values are defined as `semanticTokens` in the theme. Semantic tokens are tokens that change depending on the color mode.

```js
// panda.config.js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          primary: { value: { base: '#07c', _dark: '#0cf' } }
        }
      }
    }
  }
})

// Button.js
import { css } from 'styled-system/css'

const Demo = () => (
  <button
    className={css({
      color: 'primary'
    })}
  />
)
```

## Global Styles

Theme UI offers a Global component (that wraps Emotion’s) for adding global CSS with theme-based values.

```jsx
import { Global } from 'theme-ui'

export default props => (
  <Global
    styles={{
      button: {
        m: 0,
        bg: 'primary',
        color: 'background',
        border: 0
      }
    }}
  />
)
```

In Panda, global styles are defined in the `theme.global` property of the panda config.

```js
// panda.config.js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  globalCss: {
    button: {
      m: 0,
      bg: 'primary',
      color: 'background',
      border: 0
    }
  }
})
```

## Component Styles

Theme UI offers pre-defined layout components like `Box`, `Stack`, `Grid`, `Flex`

```jsx
import { Box, Grid } from 'theme-ui'

const Demo = () => (
  <Grid width={[128, null, 192]}>
    <Box bg="primary">Box</Box>
    <Box bg="muted">Box</Box>
    <Box bg="primary">Box</Box>
    <Box bg="muted">Box</Box>
  </Grid>
)
```

In Panda, these are called "layout patterns", or "patterns" for short. Panda provides similar patterns that can be used as a function or JSX element just like Theme UI.

```jsx
import { Box, Grid } from 'styled-system/jsx'

const Demo = () => (
  <Grid width={[128, null, 192]}>
    <Box bg="primary">Box</Box>
    <Box bg="muted">Box</Box>
  </Grid>
)
```

The function approach can be handy as well

```jsx
import { css } from 'styled-system/css'
import { grid } from 'styled-system/patterns'

const Demo = () => (
  <div className={grid({ width: [128, null, 192] })}>
    <div className={css({ bg: 'primary' })}>Box</div>
    <div className={css({ bg: 'muted' })}>Box</div>
  </div>
)
```
