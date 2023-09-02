---
'@pandacss/token-dictionary': minor
---

- Fix for issue 1062: expand `colorPalette` flexibility
- Introduces deep nested `colorPalettes` for enhanced color management
- Previous color palette structure was flat and less flexible, now `colorPalettes` can be organized hierarchically for
  improved organization

Example: Define colors within categories, variants and states

```js
{
    theme: {
        extend: {
            semanticTokens: {
                colors: {
                    button: {
                        dark: {
                            value: 'navy',
                        },
                        light: {
                            DEFAULT: {
                                value: 'skyblue',
                            },
                            accent: {
                                DEFAULT: {
                                    value: 'cyan',
                                },
                                secondary: {
                                    value: 'blue',
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}
```

Usage examples:

You can use the root `button` color palette and its values directly:

```tsx
import { css } from ".panda/css"

export const App = () => {
    return (
        <button
            className={css({
            colorPalette: 'button',
            color: 'colorPalette.light',
            backgroundColor: 'colorPalette.dark',
            _hover: {
                color: 'colorPalette.light.accent',
                background: 'colorPalette.light.accent.secondary',
            },
            })}
        >
         Root color palette
        </button>
    )
})
```

Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

```tsx
import { css } from ".panda/css"

export const App = () => {
    return (
        <button
            className={css({
                colorPalette: 'button.light.accent',
                color: 'colorPalette.secondary',
            })}
        >
            Nested color palette leaf
        </button>
    )
})
```

Or you can use any deeply nested property (e.g. `button.light.accent`) as a root color palette:

```tsx
import { css } from ".panda/css"

export const App = () => {
    return (
        <button
            className={css({
                colorPalette: 'button.light.accent',
                color: 'colorPalette.secondary',
            })}
        >
            Nested color palette leaf
        </button>
    )
})
```