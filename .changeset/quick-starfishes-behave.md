---
'@pandacss/token-dictionary': minor
'@pandacss/generator': minor
'@pandacss/config': minor
'@pandacss/types': minor
'@pandacss/core': minor
'@pandacss/dev': minor
---

Add `config.themes` to easily define and apply a theme on multiple tokens at once, using data attributes and CSS
variables.

Can pre-generate multiple themes with token overrides as static CSS, but also dynamically import and inject a theme
stylesheet at runtime (browser or server).

Example:

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
          text: { value: 'blue' },
        },
      },
      semanticTokens: {
        colors: {
          body: {
            value: {
              base: '{colors.blue.600}',
              _osDark: '{colors.blue.400}',
            },
          },
        },
      },
    },
  },
  // alternative theme variants
  themes: {
    primary: {
      tokens: {
        colors: {
          text: { value: 'red' },
        },
      },
      semanticTokens: {
        colors: {
          muted: { value: '{colors.red.200}' },
          body: {
            value: {
              base: '{colors.red.600}',
              _osDark: '{colors.red.400}',
            },
          },
        },
      },
    },
    secondary: {
      tokens: {
        colors: {
          text: { value: 'blue' },
        },
      },
      semanticTokens: {
        colors: {
          muted: { value: '{colors.blue.200}' },
          body: {
            value: {
              base: '{colors.blue.600}',
              _osDark: '{colors.blue.400}',
            },
          },
        },
      },
    },
  },
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
    themes: ['primary', 'secondary'],
  },
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

---

An alternative way of applying a theme is by using the new `styled-system/themes` entrypoint where you can import the
themes CSS variables and use them in your app.

> ℹ️ The `styled-system/themes` will always contain every themes (tree-shaken if not used), `staticCss.themes` only
> applies to the CSS output.

Each theme has a corresponding JSON file with a similar structure:

```json
{
  "name": "primary",
  "id": "panda-themes-primary",
  "dataAttr": "primary",
  "css": "[data-panda-theme=primary] { ... }"
}
```

> ℹ️ Note that for semantic tokens, you need to use inject the theme styles, see below

Dynamically import a theme using its name:

```ts
import { getTheme } from '../styled-system/themes'

const theme = await getTheme('red')
//    ^? {
//     name: "red";
//     id: string;
//     css: string;
// }
```

Inject the theme styles into the DOM:

```ts
import { injectTheme } from '../styled-system/themes'

const theme = await getTheme('red')
injectTheme(document.documentElement, theme) // this returns the injected style element
```

---

SSR example with NextJS:

```tsx
// app/layout.tsx
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { ThemeName, getTheme } from '../../styled-system/themes'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = cookies()
  const themeName = store.get('theme')?.value as ThemeName
  const theme = themeName && (await getTheme(themeName))

  return (
    <html lang="en" data-panda-theme={themeName ? themeName : undefined}>
      {themeName && (
        <head>
          <style type="text/css" id={theme.id} dangerouslySetInnerHTML={{ __html: theme.css }} />
        </head>
      )}
      <body>{children}</body>
    </html>
  )
}

// app/page.tsx
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

---

Finally, you can create a theme contract to ensure that all themes have the same structure:

```ts
import { defineThemeContract } from '@pandacss/dev'

const defineTheme = defineThemeContract({
  tokens: {
    colors: {
      red: { value: '' }, // theme implementations must have a red color
    },
  },
})

defineTheme({
  selector: '.theme-secondary',
  tokens: {
    colors: {
      // ^^^^   Property 'red' is missing in type '{}' but required in type '{ red: { value: string; }; }'
      //
      // fixed with
      // red: { value: 'red' },
    },
  },
})
```
