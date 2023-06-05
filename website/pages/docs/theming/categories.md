---
title: Token Categories
description: Design tokens in Panda are grouped by categories which inherently maps to the required `$type` field in the [W3C Token Format](#).
---

# Token Categories

Design tokens in Panda are grouped by categories which inherently maps to the required `$type` field in the
[W3C Token Format](#).

Panda is compatible with the following design tokens:

## Borders

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

## Colors

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

## Z-Index

This token type represents the depth of an element's position on the z-axis.

```jsx
const theme = {
  tokens: {
    zIndices: {
      modal: { value: 1000 }
    }
  }
}
```

## Gradients

Gradient tokens represent a smooth transition between two or more colors. Its value can be defined as a string or a
composite value.

```ts
type Gradient =
  | string
  | {
      type: 'linear' | 'radial'
      placement: string
      colors: Array<string | { color: string; position: number }>
    }
```

```jsx
const theme = {
  tokens: {
    gradients: {
      primary: {
        value: {
          type: 'linear',
          placement: 'to right',
          colors: ['red', 'blue']
        }
      }
    }
  }
}
```

## Durations

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

## Fonts

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

## Font Sizes

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

## Font Weights

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

## Letter Spacings

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

## Line Heights

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

## Radii

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

## Sizes

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

## Spacings

Spacing tokens represent the margin and padding of an element. Its value is defined as a string.

```jsx
const theme = {
  tokens: {
    spacings: {
      sm: { value: '12px' }
    }
  }
}
```

## Shadows

Shadow tokens represent the shadow of an element. Its value is defined as a single or multiple values containing a
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

## Easings

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

## Opacity

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

## Assets

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

## Animations

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
