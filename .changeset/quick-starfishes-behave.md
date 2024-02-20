---
'@pandacss/token-dictionary': minor
'@pandacss/generator': minor
'@pandacss/config': minor
'@pandacss/types': minor
'@pandacss/core': minor
'@pandacss/dev': minor
---

Add `config.themes` to easily define and apply a theme on multiple tokens at once

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
          blue: { value: 'blue' },
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
    red: {
      selector: '.theme-red',
      tokens: {
        colors: {
          red: { value: 'red' },
        },
      },
      semanticTokens: {
        colors: {
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

> ℹ️ By default, no additional theme variant is generated, you need to specify the themes you want to generate in
> `staticCss.themes`

This will generate the following CSS:

```css
@layer tokens {
  :where(:root, :host) {
    --colors-blue: blue;
    --colors-body: var(--colors-blue-600);
  }

  .theme-red {
    --colors-red: red;
    --colors-body: var(--colors-red-600);
  }

  @media (prefers-color-scheme: dark) {
    :where(:root, :host) {
      --colors-body: var(--colors-blue-400);
    }

    .theme-red {
      --colors-body: var(--colors-red-400);
    }
  }
}
```

---

An alternative way of applying a theme is by using the new `styled-system/themes` entrypoint where you can import the
themes CSS variables and use them in your app.

Each theme is a JSON file with the following structure:

```json
{
  "name": "red",
  "selector": ".theme-red",
  "vars": {
    "--colors-primary": "var(--colors-primary)",
    "--colors-text": "var(--colors-text)"
  }
}
```

> ℹ️ Note that this will only allow overriding the `tokens` values, not the `semanticTokens` as their values depend on
> the current applied conditions at runtime.

You can synchronously import a theme and use its vars:

```ts
import redTheme from '../styled-system/themes/red.json'

redTheme.vars
//       ^? {
//     "--colors-blue": string;
//     "--colors-body": string;
// }
```

Or dynamically import a theme using its name:

```ts
import { getThemeVars } from '../styled-system/themes'

const theme = await getThemeVars('red')
//    ^? {
//     name: "red";
//     selector: string;
//     vars: Record<"--colors-blue" | "--colors-body", string>;
// }
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
