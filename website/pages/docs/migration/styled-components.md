---
title: Migrating from Styled Components
description: Migrate your project from Styled Components to Panda.
---

# Migrating from Styled Components

This guide outlines the steps needed to migrate your project from Styled Components to Panda, and some design differences between the two libraries.

> **Disclaimer:** This isn't about comparing which one is best. Panda and Styled Components are two different CSS-in-JS solutions with design decisions.

Here are some similarities between the two libraries.

- Both libraries support the use of tagged template literals or object syntax to style components.
- Both libraries provide a way to define design tokens (variables) and use them in your styles.
- Both libraries require the use of `&` for nested selectors.

Below are some differences between the two libraries.

## Installation and Syntax

In styled-components, you can use both tagged template literals and object syntax to style components.

In Panda, you need to decide which syntax you want to use. Panda recommends using the object syntax, but provides a way to opt-in to tagged template literals.

To initialize a project with the object syntax, run the following command.

```bash
panda init -p --jsx-framework react
```

To initialize a project with the tagged template literal syntax, run the following command.

```bash
panda init -p --syntax template-literal --jsx-framework react
```

Then you need to add the cascade layers to the global styles of your project.

```css
@layer reset, base, tokens, recipes, utilities;
```

## Tagged Template Syntax

In styled-components, the recommended way to style components is to use tagged template literals.

```jsx
import styled from 'styled-components'

const Button = styled.button`
  background-color: #fff;
  border: 1px solid #000;
  color: #000;
  padding: 0.5rem 1rem;
`
```

In Panda, you will use the autogenerate code in the `styled-system` directory at the root of your project.

> Remember to initialize your project with the `--syntax template-literal` flag or update the panda.config.ts file.

```jsx
import { styled } from '../styled-system/jsx'

const Button = styled.button`
  background-color: #fff;
  border: 1px solid #000;
  color: #000;
  padding: 0.5rem 1rem;
`
```

## Object Syntax

In styled-components, you can use the object syntax to style components.

```jsx
import styled from 'styled-components'

const Button = styled.button({
  backgroundColor: '#fff',
  border: '1px solid #000',
  color: '#000',
  padding: '0.5rem 1rem'
})
```

In Panda, you add the style object to the `base` key of the style object. The `styled` factory allows you define base styles, variants and compound variants of your component.

```jsx
import { styled } from '../styled-system/jsx'

const Button = styled('div', {
  base: {
    backgroundColor: '#fff',
    border: '1px solid #000',
    color: '#000',
    padding: '0.5rem 1rem'
  }
})
```

<!--
## Prop Interpolation

In styled-components, you can interpolate the component's props to conditionally set styles.

```jsx
const Button = styled.button`
  ${props =>
    props.color === 'violet' &&
    `
    background-color: 'blueviolet'
  `}

  ${props =>
    props.color === 'gray' &&
    `
    background-color: 'gainsboro'
  `}
`
```

In Panda, we model interpolations using the variants API. This allows define style groups or recipes that can be applied to components.

```jsx
const Button = styled('button', {
  variants: {
    color: {
      violet: css`
        background-color: blueviolet;
      `,
      gray: css`
        background-color: gainsboro;
      `
    }
  }
})

// Usage
<Button color="violet">Button</Button>
``` -->

## Tokens and Themes

### Defining Tokens

In styled-components, you can define tokens in a theme object that is passed to the `ThemeProvider`.
This requires the use of React's context API to access the theme object in your styles

```tsx
import { ThemeProvider } from 'styled-components'

const theme = {
  colors: {
    primary: 'blue',
    secondary: 'red'
  }
}

const App = () => (
  <ThemeProvider theme={theme}>
    <Button>Button</Button>
  </ThemeProvider>
)
```

In Panda, you define tokens in the `theme` key of the `panda.config.ts` file. This allows you to access the tokens in your styles without the need for React's context API.

```tsx
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      tokens: {
        colors: {
          primary: { value: 'blue' },
          secondary: { value: 'red' }
        }
      }
    }
  }
})
```

### Using Tokens

In styled-components, you can use tokens in your styles using a function approach that provides the `theme` prop, and requires ambient type declarations to get type safety.

```tsx
import styled from 'styled-components'

// link.tsx
const StyledLink = styled.a(({ theme }) => ({
  color: theme.colors.primary,
  display: 'block',
  textDecoration: 'none'
}))

// theme.d.ts
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string
      secondary: string
    }
  }
}
```

In Panda, the tokens are automatically available in your styles and connected to each css property, removing the need for an interpolation function.

```tsx
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    // extend the base theme
    extend: {
      tokens: {
        // add custom colors
        colors: {
          primary: { value: 'blue' },
          secondary: { value: 'red' }
        }
      }
    }
  }
})

// link.tsx
const StyledLink = styled('a', {
  base: {
    color: 'primary',
    display: 'block',
    textDecoration: 'none'
  }
})
```

## Responsive Styles

### Tagged Template Syntax

In styled-components, you need to write the media query styles manually or use a helper function like `styled-media-query`.

```tsx
import styled from 'styled-components'

const Button = styled.button`
  background-color: #fff;
  border: 1px solid #000;
  color: #000;
  padding: 0.5rem 1rem;

  @media (min-width: 768px) {
    padding: 1rem 2rem;
  }
`
```

In Panda, it's pretty much the same thing except that you can't do any interpolation in the media query styles due the static nature of Panda.

```tsx
import { styled } from '../styled-system/jsx'

const Button = styled.button`
  background-color: #fff;
  border: 1px solid #000;
  color: #000;
  padding: 0.5rem 1rem;

  @media (min-width: 768px) {
    padding: 1rem 2rem;
  }
`
```

### Object Syntax

In styled-components, you can use the `styled-media-query` helper function to write responsive styles.

```tsx
import styled from 'styled-components'
import media from 'styled-media-query'

const Button = styled.button({
  backgroundColor: '#fff',
  border: '1px solid #000',
  color: '#000',
  padding: '0.5rem 1rem',

  [media.greaterThan('medium')]: {
    padding: '1rem 2rem'
  }
})
```

In Panda, you can use the pseudo props API to define responsive styles.

```tsx
import { styled } from '../styled-system/jsx'

const Button = styled.button({
  base: {
    backgroundColor: '#fff',
    border: '1px solid #000',
    color: '#000',
    padding: { base: '0.5rem 1rem', md: '1rem 2rem' }
  }
})
```

## Global Styles

In styled-components, you can use the `createGlobalStyle` function to define global styles.

```tsx
import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }
`
```

In Panda, you can use the `globalCss` key of the `panda.config.ts` file to define global styles. This will automatically add styles to the project via PostCSS.

```tsx
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  globalCss: {
    body: {
      margin: 0,
      padding: 0
    }
  }
})
```

## Targeting Components

In styled-components, you can target existing styled components within the styled function

```tsx
const Link = styled.a`
  background: papayawhip;
  color: #bf4f74;
`

const Icon = styled.svg`
  width: 48px;
  height: 48px;

  ${Link}:hover & {
    fill: rebeccapurple;
  }
`
```

In Panda, you need to use the native selector directly. This is largely due to the static nature of Panda

```tsx
const Link = styled.a`
  background: papayawhip;
  color: #bf4f74;
`

const Icon = styled.svg`
  width: 48px;
  height: 48px;

  .Link:hover & {
    fill: rebeccapurple;
  }
`

const App = () => (
  <Link className="Link">
    <Icon />
  </Link>
)
```

## Animations

In styled components, you can define keyframes using the `keyframes` method.

```ts
const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
`

// usage
const Button = styled.button`
  &:hover {
    animation: ${rotate} 200ms;
  }
`
```

In Panda, you define keyframes in the `theme.keyframes` key of the `panda.config` function.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      keyframes: {
        rotate: {
          from: {
            transform: 'rotate(0deg)'
          },
          to: {
            transform: 'rotate(360deg)'
          }
        }
      }
    }
  }
})

// usage
const style = styled.button`
  &:hover {
    animation: rotate 200ms;
  }
`
```

## Server-Side Rendering

In styled components, you need to configure the server-side rendering for your framework.

```tsx
import { renderToString } from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'

const sheet = new ServerStyleSheet()
try {
  const html = renderToString(sheet.collectStyles(<YourApp />))
  const styleTags = sheet.getStyleTags() // or sheet.getStyleElement();
} catch (error) {
  // handle error
  console.error(error)
} finally {
  sheet.seal()
}
```

In Panda, you don't need to configure anything. Panda automatically extracts the styles and injects them at build time using PostCSS.

## Conclusion

Before choosing your preferred CSS-in-JS library, be sure to consider your engineering and design goals. Both Styled components and Panda are capable of achieving many of the same styling goals, but they have different approaches.
