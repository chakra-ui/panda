---
title: Virtual Color
description: Panda allows you to create a virtual color or color placeholder in your project.
---

# Virtual Color

Panda allows you to create a virtual color or color placeholder in your project. The `colorPalette` property is how you
create virtual color.

```js
import { css } from '../styled-system/css'

const className = css({
  colorPalette: 'blue',
  bg: 'colorPalette.100',
  _hover: {
    bg: 'colorPalette.200'
  }
})
```

This will translate to the `blue.100` background color and `blue.200` background color on hover.

Virtual colors are useful when creating easily customizable components.

## Using with recipes

You can also use virtual colors with recipes.

```js
import { css, cva, cx } from '../styled-system/css'

const button = cva({
  base: {
    padding: 4
    // you can also specify a default colorPalette in the `base` recipe key
    // colorPalette: 'blue',
    // ^^^^^^^^^^^^^^^^^^^^
  },
  variants: {
    variant: {
      primary: { color: 'colorPalette.500' }
    }
  },
  defaultVariants: { variant: 'primary' }
})
```

## Using with different color modes

You can also use virtual colors with different conditions, such as color modes.

```js
import { css, cva, cx } from '../styled-system/css'

const someButton = cva({
  base: { padding: 4 },
  variants: {
    variant: {
      primary: {
        bg: { base: 'colorPalette.500', _dark: 'colorPalette.200' },
        color: { base: 'white', _dark: 'gray.900' }
      }
    }
  },
  defaultVariants: { variant: 'primary' }
})

export const App = () => {
  return (
    <>
      <div className="light">
        <button className={cx(css({ colorPalette: 'blue' }), someButton())}>
          Click me
        </button>
        <button className={cx(css({ colorPalette: 'green' }), someButton())}>
          Click me
        </button>
        <button className={cx(css({ colorPalette: 'red' }), someButton())}>
          Click me
        </button>
      </div>
      <div className="dark">
        <button className={cx(css({ colorPalette: 'blue' }), someButton())}>
          Click me
        </button>
        <button className={cx(css({ colorPalette: 'green' }), someButton())}>
          Click me
        </button>
        <button className={cx(css({ colorPalette: 'red' }), someButton())}>
          Click me
        </button>
      </div>
    </>
  )
}
```

## Semantic Virtual Colors

Semantic virtual colors gives you an ability to create a virtual color organized by category, variant and state.
Hierarchically organized virtual colors are useful when creating easily customizable components.

```js
const theme = {
  extend: {
    semanticTokens: {
      colors: {
        button: {
          dark: {
            value: 'navy'
          },
          light: {
            DEFAULT: {
              value: 'skyblue'
            },
            accent: {
              DEFAULT: {
                value: 'cyan'
              },
              secondary: {
                value: 'blue'
              }
            }
          }
        }
      }
    }
  }
}
```

You can now use the root `button` color palette and its values directly:

```tsx
import { css } from '../styled-system/css'

export const App = () => {
  return (
    <button
      className={css({
        colorPalette: 'button',
        color: 'colorPalette.light',
        backgroundColor: 'colorPalette.dark',
        _hover: {
          color: 'colorPalette.light.accent',
          background: 'colorPalette.light.accent.secondary'
        }
      })}
    >
      Root color palette
    </button>
  )
}
```

Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

```tsx
import { css } from '../styled-system/css'

export const App = () => {
  return (
    <button
      className={css({
        colorPalette: 'button.light.accent',
        color: 'colorPalette.secondary'
      })}
    >
      Nested color palette leaf
    </button>
  )
}
```

## Pregenerated Virtual Colors

Use the `staticCss` option in the config to pre-generate values for the `colorPalette` property.

This is useful when you want to use a color palette that can be changed at runtime (e.g. in Storybook knobs).

> Learn more about [static css generation](/docs/guides/static).

```tsx
export default defineConfig({
  staticCss: {
    css: [
      {
        properties: { colorPalette: ['red', 'blue'] }
      }
    ]
  }
})
```

Then in your code, you can design components that use the `colorPalette` property:

```tsx
import { css } from '../styled-system/css'

function ButtonShowcase() {
  const [colorPalette, setColorPalette] = useState('red')
  return (
    <div>
      <select
        value={colorPalette}
        onChange={e => setColorPalette(e.currentTarget.value)}
      >
        <option value="red">Red</option>
        <option value="blue">Blue</option>
      </select>

      <button
        className={css({
          bg: 'colorPalette.50',
          color: 'colorPalette.500',
          colorPalette
        })}
      >
        Click me
      </button>
    </div>
  )
}
```
