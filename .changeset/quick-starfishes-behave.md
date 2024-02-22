---
'@pandacss/token-dictionary': minor
'@pandacss/generator': minor
'@pandacss/config': minor
'@pandacss/types': minor
'@pandacss/core': minor
'@pandacss/dev': minor
---

Add `config.themes` to easily define and apply a theme on multiple tokens at once, using data attributes (or className)
and CSS variables.

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
  },
  staticCss: {
    // only generate the red in addition to the main one
    themes: ['primary'],
    // use  ['*'] to generate all themes
  },
})
```

> ℹ️ By default, no additional theme variant is generated, you need to specify the specific themes you want to generate
> in `staticCss.themes` to include them in the CSS output.

This will generate the following CSS:

```css
@layer tokens {
  :where(:root, :host) {
    --colors-text: blue;
    --colors-body: var(--colors-blue-600);
  }

  [data-theme='primary'] {
    --colors-text: red;
    --colors-muted: var(--colors-red-200);
    --colors-body: var(--colors-red-600);
  }

  @media (prefers-color-scheme: dark) {
    :where(:root, :host) {
      --colors-body: var(--colors-blue-400);
    }

    [data-theme='primary'] {
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
  "vars": {
    "--colors-text": "red",
    "--colors-muted": "var(--colors-red-200)",
    "--colors-body": "var(--colors-body)"
  },
  "css": " [data-theme=primary] {\n    --colors-text: red;\n    --colors-muted: var(--colors-red-200);\n    --colors-body: var(--colors-red-600)\n}\n\n@media (prefers-color-scheme: dark) {\n      [data-theme=primary] {\n        --colors-body: var(--colors-red-400)\n            }\n        }"
}
```

The `vars` object contains the CSS variable names with their values, resolved to their final value if they are direct
references to other tokens.

> ⚠️ Conditional references are not resolved in `vars`, as they depend on the runtime environment The `css` string
> contains the CSS rules to apply the theme, including the rules related to conditional references for `semanticTokens`

You can synchronously import a theme and use its `vars`:

```ts
import redTheme from '../styled-system/themes/red.json'

redTheme.vars
//       ^? {
//     "--colors-blue": string;
//     "--colors-body": string;
// }

// later in your app
const container = document.getElementById('container')
Object.entries(redTheme.vars).forEach(([key, value]) => {
  container.style.setProperty(key, value)
})
```

> ℹ️ Note that for semantic tokens, you need to use inject the theme styles, see below

Dynamically import a theme using its name:

```ts
import { getTheme } from '../styled-system/themes'

const theme = await getTheme('red')
//    ^? {
//     name: "red";
//     selector: string;
//     vars: Record<"--colors-blue" | "--colors-body", string>;
// }
```

Inject the theme styles into the DOM:

```ts
import { injectTheme } from '../styled-system/themes'

const theme = await getTheme('red')
injectTheme(theme) // this returns the injected style element
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
  const themeName = (store.get('theme')?.value as ThemeName) || 'default'
  const theme = await getTheme(themeName)

  return (
    <html lang="en" data-theme={themeName}>
      <head>
        <style id={theme.id} dangerouslySetInnerHTML={{ __html: theme.css }} />
      </head>
      <body>{children}</body>
    </html>
  )
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
