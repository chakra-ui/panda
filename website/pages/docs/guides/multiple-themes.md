---
title: Multi-Theme Tokens
description: Panda supports advance token definition beyond just light/dark mode; theming beyond just dark mode. You can define multi-theme tokens using nested conditions.
---

## Multi-Theme Tokens

Panda supports advance token definition beyond just light/dark mode; theming beyond just dark mode. You can define
multi-theme tokens using nested conditions.

Let's say your application supports a pink and blue theme, and each theme can have a light and dark mode. Let's see how
to model this in Panda.

We'll start by defining the following conditions for these theme and color modes:

```js
const config = {
  conditions: {
    light: '[data-color-mode=light] &',
    dark: '[data-color-mode=dark] &',
    pinkTheme: '[data-theme=pink] &',
    blueTheme: '[data-theme=blue] &'
  }
}
```

> Conditions are a way to provide preset css selectors or media queries for use in your Panda project

Next, we'll define a `colors.text` semantic token for the pink and blue theme.

```js
const theme = {
  // ...
  semanticTokens: {
    colors: {
      text: {
        value: {
          _pinkTheme: '{colors.pink.500}',
          _blueTheme: '{colors.blue.500}'
        }
      }
    }
  }
}
```

Next, we'll modify `colors.text` to support light and dark color modes for each theme.

```js
const theme = {
  // ...
  semanticTokens: {
    colors: {
      text: {
        value: {
          _pinkTheme: { base: '{colors.pink.500}', _dark: '{colors.pink.300}' },
          _blueTheme: { base: '{colors.blue.500}', _dark: '{colors.blue.300}' }
        }
      }
    }
  }
}
```

Now, you can use the `text` token in your styles, and it will automatically change based on the theme and the color
scheme.

```jsx
// use pink and dark mode theme
<html data-theme="pink" data-color-mode="dark">
  <body>
    <h1 className={css({ color: 'text' })}>Hello World</h1>
  </body>
</html>

// use pink and light mode theme
<html data-theme="pink">
  <body>
    <h1 className={css({ color: 'text' })}>Hello World</h1>
  </body>
</html>
```

## Multi-Themes

The above example shows you how to define multi-theme tokens using nested conditions but you can also define clearly separated themes using the `themes` property in the config.

This allows you to apply a `theme` on multiple tokens at once, using data attributes and CSS variables.

> Theme variants can be applied using the `data-panda-theme` attribute with the theme key as the value.

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  // main theme
  theme: {
    extend: {
      tokens: {
        colors: {
          text: { value: 'green' }
        }
      },
      semanticTokens: {
        colors: {
          body: {
            value: {
              base: '{colors.green.600}',
              _osDark: '{colors.green.400}'
            }
          }
        }
      }
    }
  },
  // alternative theme variants
  themes: {
    primary: {
      tokens: {
        colors: {
          text: { value: 'red' }
        }
      },
      semanticTokens: {
        colors: {
          muted: { value: '{colors.red.200}' },
          body: {
            value: {
              base: '{colors.red.600}',
              _osDark: '{colors.red.400}'
            }
          }
        }
      }
    },
    secondary: {
      tokens: {
        colors: {
          text: { value: 'blue' }
        }
      },
      semanticTokens: {
        colors: {
          muted: { value: '{colors.blue.200}' },
          body: {
            value: {
              base: '{colors.blue.600}',
              _osDark: '{colors.blue.400}'
            }
          }
        }
      }
    }
  }
})
```

### Pregenerating themes

By default, no additional theme variant is generated, you need to specify the specific themes you want to generate in
`staticCss.themes` to include them in the CSS output.

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  staticCss: {
    themes: ['primary', 'secondary']
  }
})
```

This will generate the following CSS:

```css
@layer tokens {
  :where(:root, :host) {
    --colors-text: blue;
    --colors-body: var(--colors-blue-600);
  }

  [data-panda-theme='primary'] {
    --colors-text: red;
    --colors-muted: var(--colors-red-200);
    --colors-body: var(--colors-red-600);
  }

  @media (prefers-color-scheme: dark) {
    :where(:root, :host) {
      --colors-body: var(--colors-blue-400);
    }

    [data-panda-theme='primary'] {
      --colors-body: var(--colors-red-400);
    }
  }
}
```

### Dynamically importing themes

An alternative way of applying a theme is by using the new `styled-system/themes` entrypoint where you can import the
themes expected CSS and apply them in your app.

> ℹ️ The `styled-system/themes` will always contain every themes (tree-shaken if not used), whereas `staticCss.themes` only
> applies to the CSS output.

Each theme has a corresponding JSON file with a similar structure:

```json
{
  "name": "primary",
  "id": "panda-themes-primary",
  "css": "[data-panda-theme=primary] { ... }"
}
```

#### Dynamically import a theme using its name

```ts
import { getTheme } from '../styled-system/themes'

const theme = await getTheme('red')
//    ^? {
//     name: "red";
//     id: string;
//     css: string;
// }
```

#### Inject the theme styles into the DOM:

```ts
import { injectTheme } from '../styled-system/themes'

const theme = await getTheme('red')
injectTheme(document.documentElement, theme) // this returns the injected style element
```

#### SSR example with NextJS:

```tsx
// app/layout.tsx
import { cookies } from 'next/headers'
import './globals.css'
import { ThemeName, getTheme } from '../../styled-system/themes'

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const store = cookies()
  const themeName = store.get('theme')?.value as ThemeName
  const theme = themeName && (await getTheme(themeName))

  return (
    <html lang="en" data-panda-theme={themeName ? themeName : undefined}>
      {themeName && (
        <head>
          <style
            type="text/css"
            id={theme.id}
            dangerouslySetInnerHTML={{ __html: theme.css }}
          />
        </head>
      )}
      <body>{children}</body>
    </html>
  )
}
```

```tsx
// app/page.tsx
'use client'
import { getTheme, injectTheme } from '../../styled-system/themes'

export default function Home() {
  return (
    <>
      <button
        onClick={async () => {
          const current = document.documentElement.dataset.pandaTheme
          const next = current === 'primary' ? 'secondary' : 'primary'
          const theme = await getTheme(next)
          setCookie('theme', next, 7)
          injectTheme(document.documentElement, theme)
        }}
      >
        swap theme
      </button>
    </>
  )
}

// Set a Cookie
function setCookie(cName: string, cValue: any, expDays: number) {
  let date = new Date()
  date.setTime(date.getTime() + expDays * 24 * 60 * 60 * 1000)
  const expires = 'expires=' + date.toUTCString()
  document.cookie = cName + '=' + cValue + '; ' + expires + '; path=/'
}
```

### Theme contract

Finally, you can create a theme contract to ensure that all themes have the same structure:

```ts
import { defineThemeContract } from '@pandacss/dev'

const defineTheme = defineThemeContract({
  tokens: {
    colors: {
      red: { value: '' } // theme implementations must have a red color
    }
  }
})

defineTheme({
  tokens: {
    colors: {
      // ^^^^ ❌  Property 'red' is missing in type '{}' but required in type '{ red: { value: string; }; }'
      //
      // ✅ fixed with
      // red: { value: 'red' },
    }
  }
})
```
