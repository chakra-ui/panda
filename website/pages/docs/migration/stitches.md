---
title: Migrating from Stitches
description: Migrate your project from Stitches to Panda.
---

# Migrating from Stitches

This guide outlines the steps needed to migrate your project from Stitches to Panda, and some design differences between the two libraries.

> **Disclaimer:** This isn't about comparing which one is best. Panda and Stitches are two different CSS-in-JS solutions with design decisions.

Here are some similarities between the two libraries.

- Panda uses the object literal syntax to define styles. It also supports the shorthand syntax for the `margin` and `padding` properties.
- Panda supports the `variants`, `defaultVariants` and `compoundVariants` APIs.
- Panda supports design tokens and themes.
- Panda supports all the variants of nested selectors (attribute, class, pseudo, descendant, child, sibling selectors and more). It also requires the use of the `&` to chain selectors.

Below are some of the differences between the two libraries.

## css function

In Stitches, the `css` function is used to author both regular style objects and variant style objects.

```tsx
import { css } from '@stitches/react'

// definition
const styles = css({
  border: 'solid 1px red',
  backgroundColor: 'transparent',

  variants: {
    variant: {
      // ...
    }
  }
})

// usage
<button className={styles({ variant: 'primary' })} />
```

In Panda, the `css` function is only used to author atomic styles, and the `cva` function to create variant style objects.

**The css function**

```tsx
import { css } from '../styled-system/css'

// definition
const styles = css({
  border: 'solid 1px red',
  backgroundColor: 'transparent'
})

// usage
<button className={styles} />
```

**The cva function**

```tsx
import { cva } from '../styled-system/css'

// definition
const styles = cva({
  base: {
    border: 'solid 1px red',
    backgroundColor: 'transparent'
  },
  variants: {
    variant: {
      // ...
    }
  }
})

// usage
<button className={styles({ variant: 'primary' })} />
```

## styled function

In Stitches, the `styled` function can be used to create components that are bound to both regular and variant styles objects.

```tsx
import { styled } from '@stitches/react'

const Button = styled('button', {
  // base styles
  backgroundColor: 'gainsboro',
  borderRadius: '9999px',

  variants: {
    // variant styles
  }
})
```

In Panda, the base styles object needs to added to the `base` key.

```tsx
import { styled } from '../styled-system/jsx'

const Button = styled('button', {
  // base styles
  base: {
    backgroundColor: 'gainsboro',
    borderRadius: '9999px'
  },
  variants: {
    // variant styles
  }
})
```

In Stitches, the styled function generates a unique className for each variant.

```tsx
import { styled } from '@stitches/react'

const Button = styled('button', {})
// => <button class="c-coNKBW c-coNKBW-dnSdJM-variant-primary">Button</button>
```

In Panda, you can decide if you want unique classNames for the recipe or you want atomic classNames.

- **Atomic classes** using the `cva` function or defining the recipe inline in the `styled` function

```tsx
import { styled } from '../styled-system/jsx'

const Button = styled('button', {
  base: {
    backgroundColor: 'gainsboro',
    borderRadius: '9999px'
  }
})
// => <button class="bg_gainsboro rounded_999px">Button</button>
```

- **Selector classes** by defining the recipe in the `panda.config.ts` file. This approach only generates the classes and css for the variants that are used in the project.

```ts
import { defineConfig, defineRecipe } from '@pandacss/dev'

const buttonStyle = defineRecipe({
  className: 'button',
  base: {
    backgroundColor: 'gainsboro',
    borderRadius: '9999px'
  },
  variants: {
    // variant styles
  }
})

export default defineConfig({
  theme: {
    extend: {
      recipes: {
        buttonStyle
      }
    }
  }
})
```

> You might need to run `panda codegen --clean` to generate the recipe functions.

```tsx
import { styled } from '../styled-system/jsx'
import { buttonStyle } from '../styled-system/recipes'

// create a styled component using the recipe function
const Button = styled('button', buttonStyle)

// or you can use directly in the JSX
<button className={buttonStyle({ variant: 'primary' })}>Button</button>

// => <button className="button button--variant-primary">Button</button>
```

## Responsive Styles

In Stitches, you configure breakpoints in the `media` key of the `createStitches` method, and use it via the `@<breakpoint>` syntax.

```ts
import { createStitches } from '@stitches/react';

// configure
const { styled, css } = createStitches({
  media: {
    bp1: '(min-width: 640px)',
    bp2: '(min-width: 768px)'
  }
})

// usage
const styles = css({
  backgroundColor: 'gainsboro',
  '@bp1': {
    backgroundColor: 'tomato'
  }
})
```

In Panda, you configure breakpoints in the `theme.breakpoints` key of the `panda.config` function

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      breakpoints: {
        bp1: '640px',
        bp2: '768px'
      }
    }
  }
})

// usage
import { css } from '../styled-system/css'

const styles = css({
  bg: 'gainsboro',
  bp1: { bg: 'tomato' },
  // or
  margin: { base: '10px', bp1: '20px' }
})
```

In Stitches, you use the `@initial` keyword to target the base styles.

In Panda, you use the `base` key to target the base styles.

## Tokens and Theme

### Tokens

In Stitches, tokens are defined in the `theme` key of the `createStitches` method.

```ts
import { createStitches } from '@stitches/react'

const { styled, css } = createStitches({
  theme: {
    colors: {
      gray100: 'hsl(206,22%,99%)',
      gray200: 'hsl(206,12%,97%)'
    }
  },
  space: {},
  fonts: {}
})

// usage
const styles = css({
  backgroundColor: '$gray100'
})
```

In Panda, tokens are defined in the `theme` key of the `panda.config` function.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    tokens: {
      colors: {
        gray100: { value: 'hsl(206,22%,99%)' },
        gray200: { value: 'hsl(206,12%,97%)' }
      },
      spacing: {},
      fonts: {}
    },
    semanticTokens: {
      // ...
    }
  }
})

// usage
import { css } from '../styled-system/css'

const styles = css({
  backgroundColor: 'gray100'
})
```

Notice that in Panda, you don't need to use the `$` prefix to access the tokens. If you really want to use the `$` prefix, update the name of the token.

```diff
export default defineConfig({
  theme: {
    colors: {
-      gray100: { value: 'hsl(206,22%,99%)' },
+      $gray100: { value: 'hsl(206,22%,99%)' },
    },
  }
})
```

### Themes

In Stitches, the `createTheme` function is used to define dark theme values.

```tsx
import { createStitches } from '@stitches/react'

const { createTheme } = createStitches({})

// create theme
const darkTheme = createTheme({
  colors: {
    gray100: 'hsl(206,8%,12%)',
    gray200: 'hsl(206,7%,14%)'
  }
})

// apply theme
<div className={darkTheme}>
  <div>Content nested in dark theme.</div>
</div>
```

In Panda, themes are designed as semantic tokens. You can define the semantic tokens in the `semanticTokens` key of the `panda.config` function.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        gray100: {
          value: { base: 'hsl(206,22%,99%)', _dark: 'hsl(206,8%,12%)' }
        },
        gray200: {
          value: { base: 'hsl(206,12%,97%)', _dark: 'hsl(206,7%,14%)' }
        }
      }
    }
  }
})
```

### Token Aliases

In Stitches, you can create locally scoped tokens using the `$$` prefix

```ts
import { styled } from '@stitches/react'

const Button = styled('button', {
  $$shadowColor: '$colors$pink500',
  boxShadow: '0 0 0 15px $$shadowColor'
})
```

In Panda, there's no special syntax, you need to use the css variable syntax.
CSS variables are able to query the theme tokens directly using dot notation

```ts
import { styled } from '../styled-system/jsx'

const Button = styled('button', {
  base: {
    '--shadowColor': 'colors.pink500',
    boxShadow: '0 0 0 15px var(--shadowColor)'
  }
})
```

## Animations

In Stitches, you can define keyframes using the `keyframes` method.

```ts
import { keyframes, styled } from '@stitches/react'

const scaleUp = keyframes({
  '0%': { transform: 'scale(1)' },
  '100%': { transform: 'scale(1.5)' }
})

// usage
const Button = styled('button', {
  '&:hover': {
    animation: `${scaleUp} 200ms`
  }
})
```

In Panda, you define keyframes in the `theme.keyframes` key of the `panda.config` function.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      keyframes: {
        scaleUp: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.5)' }
        }
      }
    }
  }
})

// usage
import { css } from '../styled-system/css'

const style = css({
  '&:hover': {
    animation: 'scaleUp 200ms'
  }
})
```

## Utils

In Stitches, you can define utilities by using the `utils` key in the `createStitches` method.

```ts
import { createStitches, type PropertyValue } from '@stitches/react'

const { styled, css } = createStitches({
  utils: {
    linearGradient: (value: PropertyValue<'backgroundImage'>) => ({
      backgroundImage: `linear-gradient(${value})`
    })
  }
})
```

In Panda, you get a lot of built-in utilities (like mx, marginX, my, py, etc.) that you can use out of the box.
You can also create custom utilites using the `utilities` key in the `panda.config` function.

The utilities API allows you define the connected token scale, generated className, and transform function.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  utilities: {
    extend: {
      linearGradient: {
        // (optional): the css property this maps to (to inherit the types from)
        property: 'backgroundImage',
        // (optional): the className to generate
        className: 'bg_gradient',
        // (optional): the shorthand name to use in the css
        shorthand: 'gradient',
        // (required): maps the value to the raw css object
        transform: value => ({
          backgroundImage: `linear-gradient(${value})`
        })
      }
    }
  }
})
```

> Running `panda codegen` will update the typings for the utilities, allowing for a type-safe developer experience.

Then you can use the utility in your styles.

```tsx
import { css } from '../styled-system/css'

const buttonClass = css({
  linearGradient: '19deg, #21D4FD 0%, #B721FF 100%'
})
```

## Global Styles

In Stitches, you define the global styles using the `globalCss` function, and then call it in your app.

```tsx
import { globalCss } from '@stitches/react'

const globalStyles = globalCss({
  '*': { margin: 0, padding: 0 }
})

// then in your app
globalStyles()
```

In Panda, you define the global styles in the `panda.config.ts` using the `globalCss` function.

> The styles be injected automatically under the `base` cascade layer via PostCSS

```ts {3-5}
import { defineConfig, defineGlobalStyles } from '@pandacss/dev'

const globalCss = defineGlobalStyles({
  '*': { margin: 0, padding: 0 }
})

export default defineConfig({
  // ...
  globalCss
})
```

## Targeting Components

In Stitches, you can directly target React or styled components via the `toString()` method.

```tsx
import { css } from '@stitches/react'

const Icon = () => (
  <svg className="right-arrow" ... />
);

// add a `toString` method
Icon.toString = () => '.right-arrow';

const buttonClass = css({
  [`& ${Icon}`]: {
    marginLeft: '5px'
  }
})
```

In Panda, you need to use the native selector directly. This is largely due to the static nature of Panda

```tsx
import { css } from '../styled-system/css'

const Icon = () => (
  <svg className="right-arrow" ... />
);


const buttonClass = css({
  "& .right-arrow": {
    marginLeft: '5px'
  }
})
```

## Server Side Rendering

In Stitches, you need to configure the server-side rendering for your framework.

```tsx
// stitches.config.ts
import { createStitches } from '@stitches/react'
export const { getCssText } = createStitches()

// _document.tsx
export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en">
        <Head>
          <style
            id="stitches"
            dangerouslySetInnerHTML={{ __html: getCssText() }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
```

In Panda, you don't need to configure anything. Panda automatically extracts the styles and injects them at build time using PostCSS.

## Conclusion

Before choosing your preferred CSS-in-JS library, be sure to consider your engineering and design goals. Both Stitches and Panda are capable of achieving many of the same styling goals, but they have different approaches.
