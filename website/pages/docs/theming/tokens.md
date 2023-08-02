---
title: Tokens
description: Design tokens are the platform-agnostic way to manage design decisions in your application or website.
---

# Design Tokens

Design tokens are the platform-agnostic way to manage design decisions in your application or website. It is a collection of attributes that describe any fundamental/atomic visual style. Each attribute is a key-value pair.

> Design tokens in Panda are largely influenced by the [W3C Token Format](https://tr.designtokens.org/format/).

A design token consists of the following properties:

- `value`: The value of the token. This can be any valid CSS value.
- `description`: An optional description of what the token can be used for.

## Core Tokens

Tokens are defined in the `panda.config` file under the `theme` key

```js filename="panda.config.ts"
export default defineConfig({
  theme: {
    // 👇🏻 Define your tokens here
    tokens: {
      colors: {
        primary: { value: '#0FEE0F' },
        secondary: { value: '#EE0F0F' }
      },
      fonts: {
        body: { value: 'system-ui, sans-serif' }
      }
    }
  }
})
```

After defining tokens, you can use them in authoring components and styles.

```jsx
import { css } from '../styled-system/css'

function App() {
  return (
    <p
      className={css({
        color: 'primary',
        fontFamily: 'body'
      })}
    >
      Hello World
    </p>
  )
}
```

You can also add an optional description to your tokens. This will be used in the autogenerate token documentation.

```js {6}
export default defineConfig({
  theme: {
    tokens: {
      colors: {
        danger: {
          value: '#EE0F0F',
          description: 'Color for errors'
        }
      }
    }
  }
})
```

## Semantic Tokens

Semantic tokens are tokens that are designed to be used in a specific context. In most cases, the value of a semantic token references to an existing token.

> To reference a value in a semantic token, use the `{}` syntax.

For example, assuming we've defined the following tokens:

- `red` and `green` are raw tokens that define the color red and green.
- `danger` and `success` are semantic tokens that reference the `red` and `green` tokens.

```js
export default defineConfig({
  theme: {
    tokens: {
      colors: {
        red: { value: '#EE0F0F' },
        green: { value: '#0FEE0F' }
      }
    },
    semanticTokens: {
      colors: {
        danger: { value: '{colors.red}' },
        success: { value: '{colors.green}' }
      }
    }
  }
})
```

Semantic tokens can also be changed based on the [conditions](/docs/concepts/conditional-styles) like light and dark modes.

For example, if you want a color to change automatically based on light or dark mode.

```js
export default defineConfig({
  // ...
  theme: {
    semanticTokens: {
      colors: {
        danger: {
          value: { base: '{colors.red}', _dark: '{colors.darkred}' }
        },
        success: {
          value: { base: '{colors.green}', _dark: '{colors.darkgreen}' }
        }
      }
    }
  }
})
```

> NOTE 🚨: The conditions used in semantic tokens must be an at-rule or parent selector [condition](/docs/concepts/conditional-styles#reference).

## Token Nesting

Tokens can be nested to create a hierarchy of tokens. This is useful when you want to group tokens together.

> Tip: You can use the `DEFAULT` key to define the default value of a nested token.

```js
export default defineConfig({
  // ...
  theme: {
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: '{colors.gray.100}' },
          muted: { value: '{colors.gray.100}' }
        }
      }
    }
  }
})
```

This allows the use of the `bg` token in the following ways:

```jsx
import { css } from '../styled-system/css'

function App() {
  return (
    <div
      className={css({
        // 👇🏻 This will use the `DEFAULT` value
        bg: 'bg',
        // 👇🏻 This will use the `muted` value
        color: 'bg.muted'
      })}
    >
      Hello World
    </div>
  )
}
```

## Token Types

Panda supports the following token types:

### Colors

Colors have meaning and support the purpose of the content, communicating things like hierarchy of information, and
states. It is mostly defined as a string value or reference to other tokens.

```jsx
const theme = {
  tokens: {
    colors: {
      red: { 100: { value: '#fff1f0' } }
    }
  }
}
```

### Gradients

Gradient tokens represent a smooth transition between two or more colors. Its value can be defined as a string or a
composite value.

```ts
type Gradient =
  | string
  | {
      type: 'linear' | 'radial'
      placement: string | number
      stops:
        | Array<{
            color: string
            position: number
          }>
        | Array<string>
    }
```

```jsx
const theme = {
  tokens: {
    gradients: {
      // string value
      simple: { value: 'linear-gradient(to right, red, blue)' },
      // composite value
      primary: {
        value: {
          type: 'linear',
          placement: 'to right',
          stops: ['red', 'blue']
        }
      }
    }
  }
}
```

### Sizes

Size tokens represent the width and height of an element. Its value is defined as a string.

```jsx
const theme = {
  tokens: {
    sizes: {
      sm: { value: '12px' }
    }
  }
}
```

> Size tokens are typically used in `width`, `height`, `min-width`, `max-width`, `min-height`, `max-height` properties.

### Spacings

Spacing tokens represent the margin and padding of an element. Its value is defined as a string.

```jsx
const theme = {
  tokens: {
    spacing: {
      sm: { value: '12px' }
    }
  }
}
```

> Spacing tokens are typically used in `margin`, `padding`, `gap`, and `{top|right|bottom|left}` properties.

### Fonts

Font tokens represent the font family of a text element. Its value is defined as a string or an array of strings.

```jsx
const theme = {
  tokens: {
    fonts: {
      body: { value: 'Inter, sans-serif' },
      heading: { value: ['Roboto Mono', 'sans-serif'] }
    }
  }
}
```

> Font tokens are typically used in `font-family` property.

### Font Sizes

Font size tokens represent the size of a text element. Its value is defined as a string.

```jsx
const theme = {
  tokens: {
    fontSizes: {
      sm: { value: '12px' }
    }
  }
}
```

> Font size tokens are typically used in `font-size` property.

### Font Weights

Font weight tokens represent the weight of a text element. Its value is defined as a string.

```jsx
const theme = {
  tokens: {
    fontWeights: {
      bold: { value: '700' }
    }
  }
}
```

> Font weight tokens are typically used in `font-weight` property.

### Letter Spacings

Letter spacing tokens represent the spacing between letters in a text element. Its value is defined as a string.

```jsx
const theme = {
  tokens: {
    letterSpacings: {
      wide: { value: '0.1em' }
    }
  }
}
```

> Letter spacing tokens are typically used in `letter-spacing` property.

### Line Heights

Line height tokens represent the height of a line of text. Its value is defined as a string.

```jsx
const theme = {
  tokens: {
    lineHeights: {
      normal: { value: '1.5' }
    }
  }
}
```

> Line height tokens are typically used in `line-height` property.

### Radii

Radii tokens represent the radius of a border. Its value is defined as a string.

```jsx
const theme = {
  tokens: {
    radii: {
      sm: { value: '4px' }
    }
  }
}
```

> Radii tokens are typically used in `border-radius` property.

### Borders

A border is a line surrounding a UI element. You can define them as string values or as a composite value

```jsx
const theme = {
  tokens: {
    borders: {
      // string value
      subtle: { value: '1px solid red' },
      // string value with reference to color token
      danger: { value: '1px solid {colors.red.400}' },
      // composite value
      accent: { value: { width: '1px', color: 'red', style: 'solid' } }
    }
  }
}
```

> Border tokens are typically used in `border`, `border-top`, `border-right`, `border-bottom`, `border-left`, `outline`
> properties.

### Shadows

Shadow tokens represent the shadow of an element. Its value is defined as single or multiple values containing a
string or a composite value.

```ts
type CompositeShadow = {
  offsetX: number
  offsetY: number
  blur: number
  spread: number
  color: string
  inset?: boolean
}

type Shadow = string | CompositeShadow | string[] | CompositeShadow[]
```

```jsx
const theme = {
  tokens: {
    shadows: {
      // string value
      subtle: { value: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' },
      // composite value
      accent: {
        value: {
          offsetX: 0,
          offsetY: 4,
          blurRadius: 4,
          spreadRadius: 0,
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      // multiple string values
      realistic: {
        value: [
          '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          '0 1px 4px 0 rgba(0, 0, 0, 0.1)'
        ]
      }
    }
  }
}
```

> Shadow tokens are typically used in `box-shadow` property.

### Easings

Easing tokens represent the easing function of an animation or transition. Its value is defined as a string or an array
of values representing the cubic bezier.

```jsx
const theme = {
  tokens: {
    easings: {
      // string value
      easeIn: { value: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      // array value
      easeOut: { value: [0.4, 0, 0.2, 1] }
    }
  }
}
```

> Ease tokens are typically used in `transition-timing-function` property.

### Opacity

Opacity tokens help you set the opacity of an element.

```js
const theme = {
  tokens: {
    opacity: {
      50: { value: 0.5 }
    }
  }
}
```

> Opacity tokens are typically used in `opacity` property.

### Z-Index

This token type represents the depth of an element's position on the z-axis.

```jsx
const theme = {
  tokens: {
    zIndex: {
      modal: { value: 1000 }
    }
  }
}
```

> Z-index tokens are typically used in `z-index` property.

### Assets

Asset tokens represent a url or svg string. Its value is defined as a string or a composite value.

```ts
type CompositeAsset = { type: 'url' | 'svg'; value: string }
type Asset = string | CompositeAsset
```

```js
const theme = {
  tokens: {
    assets: {
      logo: {
        value: { type: 'url', url: '/static/logo.png' }
      },
      checkmark: {
        value: { type: 'svg', svg: '<svg>...</svg>' }
      }
    }
  }
}
```

> Asset tokens are typically used in `background-image` property.

### Durations

Duration tokens represent the length of time in milliseconds an animation or animation cycle takes to complete. Its
value is defined as a string.

```jsx
const theme = {
  tokens: {
    durations: {
      fast: { value: '100ms' }
    }
  }
}
```

> Duration tokens are typically used in `transition-duration` and `animation-duration` properties.

### Animations

Animation tokens represent a keyframe animation. Its value is defined as a string value.

```jsx
const theme = {
  tokens: {
    animations: {
      spin: {
        value: 'spin 1s linear infinite'
      }
    }
  }
}
```

> Animation tokens are typically used in `animation` property.

## Token Helpers

To help defining tokens in a type-safe way, you can use the following helpers:

### `defineTokens`

```ts
import { defineTokens } from '@pandacss/dev'

const theme = {
  tokens: defineTokens({
    colors: {
      primary: { value: '#ff0000' }
    }
  })
}
```

You can also use this function to define tokens in a separate file:

```ts filename="tokens/colors.ts"
import { defineTokens } from '@pandacss/dev'

export const colors = defineTokens.colors({
  primary: { value: '#ff0000' }
})
```

### `defineSemanticTokens`

```ts
import { defineSemanticTokens } from '@pandacss/dev'

const theme = {
  semanticTokens: defineSemanticTokens({
    colors: {
      primary: {
        value: { _light: '{colors.blue.400}', _dark: '{colors.blue.200}' }
      }
    }
  })
}
```

You can also use this function to define tokens in a separate file:

```ts filename="tokens/colors.semantic.ts"
import { defineSemanticTokens } from '@pandacss/dev'

export const colors = defineSemanticTokens.colors({
  primary: {
    value: { _light: '{colors.blue.400}', _dark: '{colors.blue.200}' }
  }
})
```
