# CHANGELOG

All notable changes to this project will be documented in this file.

See the [Changesets](./.changeset) for the latest changes.

## [Unreleased]

## [0.38.0] - 2024-04-29

### Fixed

- Fix css reset regressions where:
  - first letter gets a different color
  - input or select gets a default border
- Fix type import
- Fix Panda imports detection when using `tsconfig`.`baseUrl` with an outdir that starts with `./`.

### Added

- Add least resource used (LRU) cache in the hot parts to prevent memory from growing infinitely
- Add support for deprecating tokens, utilities, patterns and config recipes.

Set the `deprecated` property to `true` to enable deprecation warnings. Alternatively, you can also set it to a string
to provide a custom migration message.

**Deprecating a utility**

```js
defineConfig({
  utilities: {
    ta: {
      deprecated: true,
      transform(value) {
        return { textAlign: value }
      },
    },
  },
})
```

**Deprecating a token**

```js
defineConfig({
  theme: {
    tokens: {
      spacing: {
        lg: { value: '8px', deprecated: 'use `8` instead' },
      },
    },
  },
})
```

**Deprecating a pattern**

```js
defineConfig({
  patterns: {
    customStack: {
      deprecated: true,
    },
  },
})
```

**Deprecating a recipe**

```js
defineConfig({
  theme: {
    recipes: {
      btn: {
        deprecated: 'will be removed in v2.0',
      },
    },
  },
})
```

- Add support for array values in the special `css` property for the JSX factory and JSX patterns

This makes it even easier to merge styles from multiple sources.

```tsx
import { Stack, styled } from '../styled-system/jsx'

const HeroSection = (props) => {
  return (
    <Stack css={[{ color: 'blue.300', padding: '4' }, props.css]}>
      <styled.div css={[{ fontSize: '2xl' }, props.hero]}>Hero Section</styled.div>
    </Stack>
  )
}

const App = () => {
  return (
    <>
      <HeroSection css={{ backgroundColor: 'yellow.300' }} hero={css.raw({ fontSize: '4xl', color: 'red.300' })} />
    </>
  )
}
```

should render something like:

```html
<div class="d_flex flex_column gap_10px text_blue.300 p_4 bg_yellow.300">
  <div class="fs_4xl text_red.300">Hero Section</div>
</div>
```

## [0.37.2] - 2024-04-05

### Fixed

- fix: build correct path for debug files on windows
- Add missing type PatternProperties to solve a TypeScript issue (The inferred type of xxx cannot be named without a
  reference)
- Fix `sva` typings, the `splitVariantProps` was missing from the `d.ts` file

### Added

- Add a `getVariantProps` helper to the slot recipes API (`sva` and `config slot recipes`)

```ts
import { sva } from '../styled-system/css'
import { getVariantProps } from '../styled-system/recipes'

const button = sva({
  slots: ['root', 'icon'],
  // ...
  variants: {
    size: {
      sm: {
        // ...
      },
      md: {
        // ...
      },
    },
    variant: {
      primary: {
        // ...
      },
      danger: {
        // ...
      }
    }
  }
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  }
})

// ✅ this will return the computed variants based on the defaultVariants + props passed
const buttonProps = button.getVariantProps({ size: "sm" })
//    ^? { size: "sm", variant: "primary" }
```

### Changed

- Make `WithImportant<T>` more performant and ensure typescript is happy. This changes will make code autocompletion and
  ts-related linting much faster than before.

## [0.37.1] - 2024-04-02

### Fixed

- Improve token validation logic to parse references in `tokens` and compositve values like `borders` and `shadows`
  which could be objects.
- Fix issue where setting the pattern `jsx` option with dot notation didn't work.

```jsx
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  patterns: {
    extend: {
      grid: {
        jsx: ['Form.Group', 'Grid'],
      },
      stack: {
        jsx: ['Form.Action', 'Stack'],
      },
    },
  },
})
```

- Fix an issue where the `compoundVariants` classes would not be present at runtime when using `config recipes`

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      recipes: {
        button: {
          // ...
          variants: {
            size: {
              sm: {
                fontSize: 'sm',
              },
              // ...
            },
          },
          compoundVariants: [
            {
              size: 'sm',
              css: { color: 'blue.100'},
            },
          ],
        },
      },
    },
  },
})

// app.tsx
const Button = styled('button', button)

const App = () => {
  return (
    // ❌ this would only have the classes `button button--size_sm`
    // the `text_blue` was missing
    // ✅ it's now fixed -> `button button--size_sm text_blue`
    <Button size="sm">Click me</Button>
  )
}
```

### Added

- Add a `getVariantProps` helper to the recipes API (`cva` and `config recipes`)

```ts
import { cva } from '../styled-system/css'
import { getVariantProps } from '../styled-system/recipes'

const button = cva({
    // ...
  variants: {
    size: {
      sm: {
        fontSize: 'sm',
      },
      md: {
        fontSize: 'md',
      },
    },
    variant: {
      primary: {
        backgroundColor: 'blue.500',
      },
      danger: {
        backgroundColor: 'red.500',
      }
    }
  }
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  }
})

// ✅ this will return the computed variants based on the defaultVariants + props passed
const buttonProps = button.getVariantProps({ size: "sm" })
//    ^? { size: "sm", variant: "primary" }
```

### Changed

Public changes: Some quality of life fixes for the Studio:

- Handle displaying values using the `[xxx]` escape-hatch syntax for `textStyles` in the studio
- Display an empty state when there's no token in a specific token page in the studio

(mostly) Internal changes:

- Add `deepResolveReference` in TokenDictionary, helpful to get the raw value from a semantic token by recursively
  traversing the token references.
- Added some exports in the `@pandacss/token-dictionary` package, mostly useful when building tooling around Panda
  (Prettier/ESLint/VSCode plugin etc)

## [0.37.0] - 2024-04-01

### Fixed

- Fix className collisions between utilities by using unique class names per property in the default preset.

- Fix a bug where some styles would be grouped together in the same rule, even if they were not related to each other.

**Internal** details

This was caused by an object reference being re-used while setting a property deeply in the hashes decoding process,
leading to the mutation of a previous style object with additional properties.

### Added

- Add missing typings for CSS vars in properties bound to utilities (and that are not part of the list affected by
  `strictPropertyValues`)
- Allow multiple `importMap` (or multiple single import entrypoints if using the object format).

It can be useful to use a component library's `styled-system` while also using your own `styled-system` in your app.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  importMap: ['@acme/styled-system', '@ui-lib/styled-system', 'styled-system'],
})
```

Now you can use any of the `@acme/styled-system`, `@ui-lib/styled-system` and `styled-system` import sources:

```ts
import { css } from '@acme/css'
import { css as uiCss } from '@ui-lib/styled-system/css'
import { css as appCss } from '@ui-lib/styled-system/css'
```

- **Spacing Utilities**: Add new `spaceX` and `spaceY` utilities for applying margin between elements. Especially useful
  when applying negative margin to child elements.

```tsx
<div className={flex({ spaceX: '-1' })}>
  <div className={circle({ size: '5', bg: 'red' })} />
  <div className={circle({ size: '5', bg: 'pink' })} />
</div>
```

- Added new `_starting` condition to support the new `@starting-style` at-rule.
  [Learn more here](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)

- **Gradient Position**: Add new `gradientFromPosition` and `gradientToPosition` utilities for controlling the position
  of the gradient color stops.

```tsx
<div
  className={css({
    bgGradient: 'to-r',
    // from
    gradientFrom: 'red',
    gradientFromPosition: 'top left',
    // to
    gradientTo: 'blue',
    gradientToPosition: 'bottom right',
  })}
/>
```

### Changed

- **Color Mode Selectors**: Changed the default selectors for `_light` and `_dark` to target parent elements. This
  ensures consistent behavior with using these conditions to style pseudo elements (like `::before` and `::after`).

```diff
const conditions = {
-  _dark: '&.dark, .dark &',
+  _dark: '.dark &',
-  _light: '&.light, .light &',
+  _light: '.light &',
}
```

- Changed `divideX` and `divideY` now maps to the `borderWidths` token group.

## [0.36.1] - 2024-03-19

### Fixed

- Fix theme variants typings
- Fix JSX matching with recipes after introducing namespace imports

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  theme: {
    extend: {
      slotRecipes: {
        tabs: {
          className: 'tabs',
          slots: ['root', 'list', 'trigger', 'content', 'indicator'],
          base: {
            root: {
              display: 'flex',
              // ...
            },
          },
        },
      },
    },
  },
})
```

```tsx
const App = () => {
  return (
    // ❌ this was not matched to the `tabs` slot recipe
    // ✅ fixed with this PR
    <Tabs.Root defaultValue="button">
      <Tabs.List>
        <Tabs.Trigger value="button">Button</Tabs.Trigger>
        <Tabs.Trigger value="radio">Radio Group</Tabs.Trigger>
        <Tabs.Trigger value="slider">Slider</Tabs.Trigger>
        <Tabs.Indicator />
      </Tabs.List>
    </Tabs.Root>
  )
}
```

We introduced a bug in [v0.34.2](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0342---2024-03-08) where the
`Tabs.Trigger` component was not being matched to the `tabs` slot recipe, due to the
[new namespace import feature](https://github.com/chakra-ui/panda/pull/2371).

## [0.36.0] - 2024-03-19

### Fixed

- Fix `Expression produces a union type that is too complex to represent` with `splitCssProps` because of
  `JsxStyleProps` type

- Fix merging issue when using a preset that has a token with a conflicting value with another (or the user's config)

```ts
import { defineConfig } from '@pandacss/dev'

const userConfig = defineConfig({
  presets: [
    {
      theme: {
        extend: {
          tokens: {
            colors: {
              black: { value: 'black' },
            },
          },
        },
      },
    },
  ],
  theme: {
    tokens: {
      extend: {
        colors: {
          black: {
            0: { value: 'black' },
            10: { value: 'black/10' },
            20: { value: 'black/20' },
            30: { value: 'black/30' },
          },
        },
      },
    },
  },
})
```

When merged with the preset, the config would create nested tokens (`black.10`, `black.20`, `black.30`) inside of the
initially flat `black` token.

This would cause issues as the token engine stops diving deeper after encountering an object with a `value` property.

To fix this, we now automatically replace the flat `black` token using the `DEFAULT` keyword when resolving the config
so that the token engine can continue to dive deeper into the object:

```diff
{
  "theme": {
    "tokens": {
      "colors": {
        "black": {
          "0": {
            "value": "black",
          },
          "10": {
            "value": "black/10",
          },
          "20": {
            "value": "black/20",
          },
          "30": {
            "value": "black/30",
          },
-          "value": "black",
+          "DEFAULT": {
+            "value": "black",
+          },
        },
      },
    },
  },
}
```

- Fix an issue when using a semantic token with one (but not all) condition using the color opacity modifier

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      tokens: {
        colors: {
          black: { value: 'black' },
          white: { value: 'white' },
        },
      },
      semanticTokens: {
        colors: {
          fg: {
            value: {
              base: '{colors.black/87}',
              _dark: '{colors.white}', // <- this was causing a weird issue
            },
          },
        },
      },
    },
  },
})
```

- Fix `strictPropertyValues` typings should allow for `CssVars` (either predefined from `globalVars` or any custom CSS
  variable)

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  strictPropertyValues: true,
  globalVars: {
    extend: {
      '--some-color': 'red',
      '--button-color': {
        syntax: '<color>',
        inherits: false,
        initialValue: 'blue',
      },
    },
  },
})
```

```ts
css({
  // ❌ was not allowed before when `strictPropertyValues` was enabled
  display: 'var(--button-color)', // ✅ will now be allowed/suggested
})
```

If no `globalVars` are defined, any `var(--*)` will be allowed

```ts
css({
  // ✅ will be allowed
  display: 'var(--xxx)',
})
```

### Added

- Introduce a new `globalVars` config option to define type-safe
  [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) and custom
  [CSS @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property).

Example:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  globalVars: {
    '--some-color': 'red',
    '--button-color': {
      syntax: '<color>',
      inherits: false,
      initialValue: 'blue',
    },
  },
})
```

> Note: Keys defined in `globalVars` will be available as a value for _every_ utilities, as they're not bound to token
> categories.

```ts
import { css } from '../styled-system/css'

const className = css({
  '--button-color': 'colors.red.300',
  // ^^^^^^^^^^^^  will be suggested

  backgroundColor: 'var(--button-color)',
  //                ^^^^^^^^^^^^^^^^^^  will be suggested
})
```

- Add `config.themes` to easily define and apply a theme on multiple tokens at once, using data attributes and CSS
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

#### Pregenerating themes

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

#### Inject the theme styles into the DOM:

```ts
import { injectTheme } from '../styled-system/themes'

const theme = await getTheme('red')
injectTheme(document.documentElement, theme) // this returns the injected style element
```

#### SSR example with NextJS:

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

### Cbanged

When using `strictTokens: true`, if you didn't have `tokens` (or `semanticTokens`) on a given `Token category`, you'd
still not be able to use _any_ values in properties bound to that category. Now, `strictTokens` will correctly only
restrict properties that have values in their token category.

Example:

```ts
// panda.config.ts

export default defineConfig({
  // ...
  strictTokens: true,
  theme: {
    extend: {
      colors: {
        primary: { value: 'blue' },
      },
      // borderWidths: {}, // ⚠️ nothing defined here
    },
  },
})
```

```ts
// app.tsx
css({
  // ❌ before this PR, TS would throw an error as you are supposed to only use Tokens
  // even thought you don't have any `borderWidths` tokens defined !

  // ✅ after this PR, TS will not throw an error anymore as you don't have any `borderWidths` tokens
  // if you add one, this will error again (as it's supposed to)
  borderWidths: '123px',
})
```

#### Description

- Simplify typings for the style properties.
- Add the `csstype` comments for each property.

You will now be able to see a utility or `csstype` values in 2 clicks !

#### How

Instead of relying on TS to infer the correct type for each properties, we now just generate the appropriate value for
each property based on the config.

This should make it easier to understand the type of each property and might also speed up the TS suggestions as there's
less to infer.

## [0.35.0] - 2024-03-14

### Fixed

- Fix negative `semanticTokens` generation

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  tokens: {
    spacing: {
      1: { value: '1rem' },
    },
  },
  semanticTokens: {
    spacing: {
      lg: { value: '{spacing.1}' },
    },
  },
})
```

Will now correctly generate the negative value:

```diff
"spacing.-1" => "calc(var(--spacing-1) * -1)",
- "spacing.-lg" => "{spacing.1}",
+ "spacing.-lg" => "calc(var(--spacing-lg) * -1)",
```

- Fix extraction of JSX `styled` factory when using namespace imports

```tsx
import * as pandaJsx from '../styled-system/jsx'

// ✅ this will work now
pandaJsx.styled('div', { base: { color: 'red' } })
const App = () => <pandaJsx.styled.span color="blue">Hello</pandaJsx.styled.span>
```

### Added

- Allow using `!` or `!important` when using `strictTokens: true` (without TS throwing an error)
- Add missing reducers to properly return the results of hooks for `config:resolved` and `parser:before`
- Add missing methods for ParserResultInterface (which can be used in the `parser:after` hook to dynamically add
  extraction results from your own logic, like using a custom parser)
- Add `allow` config option in postcss plugin.
- Add an optional `className` key in `sva` config which will can be used to target slots in the DOM.

Each slot will contain a `${className}__${slotName}` class in addition to the atomic styles.

```tsx
import { sva } from '../styled-system/css'

const button = sva({
  className: 'btn',
  slots: ['root', 'text'],
  base: {
    root: {
      bg: 'blue.500',
      _hover: {
        // v--- 🎯 this will target the `text` slot
        '& .btn__text': {
          color: 'white',
        },
      },
    },
  },
})

export const App = () => {
  const classes = button()
  return (
    <div className={classes.root}>
      <div className={classes.text}>Click me</div>
    </div>
  )
}
```

The plugin won't parse css files in node modules. This config option lets you opt out of that for some paths.

```js
//postcss.config.cjs

module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {
      allow: [/node_modules\/.embroider/],
    },
  },
}
```

### Changed

- Change the `styled-system/token` JS token function to use raw value for semanticToken that do not have conditions
  other than `base`

```ts
export default defineConfig({
  semanticTokens: {
    colors: {
      blue: { value: 'blue' },
      green: {
        value: {
          base: 'green',
          _dark: 'white',
        },
      },
      red: {
        value: {
          base: 'red',
        },
      },
    },
  },
})
```

This is the output of the `styled-system/token` JS token function:

```diff
const tokens = {
    "colors.blue": {
-     "value": "var(--colors-blue)",
+     "value": "blue",
      "variable": "var(--colors-blue)"
    },
    "colors.green": {
      "value": "var(--colors-green)",
      "variable": "var(--colors-green)"
    },
    "colors.red": {
-     "value": "var(--colors-red)",
+     "value": "red",
      "variable": "var(--colors-red)"
    },
}
```

## [0.34.3] - 2024-03-09

### Fixed

Fix nested `styled` factory composition

```tsx
import { styled } from '../styled-system/jsx'

const BasicBox = styled('div', { base: { fontSize: '10px' } })
const ExtendedBox1 = styled(BasicBox, { base: { fontSize: '20px' } })
const ExtendedBox2 = styled(ExtendedBox1, { base: { fontSize: '30px' } })

export const App = () => {
  return (
    <>
      {/* ✅ fs_10px */}
      <BasicBox>text1</BasicBox>
      {/* ✅ fs_20px */}
      <ExtendedBox1>text2</ExtendedBox1>
      {/* BEFORE: ❌ fs_10px fs_30px */}
      {/* NOW: ✅ fs_30px */}
      <ExtendedBox2>text3</ExtendedBox2>
    </>
  )
}
```

### Added

Allow color opacity modifier when using `strictTokens`, e.g `color: "blue.200/50"` will not throw a TS error anymore

## [0.34.2] - 2024-03-08

### Fixed

- Fix `strictPropertyValues` with border\* properties

We had listed `border\*` properties as affected by `strictPropertyValues` but they shouldn't be restricted as their
syntax is too complex to be restricted. This removes any `border*` properties that do not specifically end with `Style`
like `borderTopStyle`.

```ts
import { css } from '../styled-system/css'

css({
  borderTop: '1px solid red', // ✅ will now be fine as it should be
  borderTopStyle: 'abc', // ✅ will still report a TS error
})
```

- Fix a false positive with the validation check that reported `Missing token` when using a color opacity modifier in
  config `tokens` or `semanticTokens`

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  validation: 'warn',
  conditions: {
    light: '.light &',
    dark: '.dark &',
  },
  theme: {
    tokens: {
      colors: {
        blue: { 500: { value: 'blue' } },
        green: { 500: { value: 'green' } },
      },
      opacity: {
        half: { value: 0.5 },
      },
    },
    semanticTokens: {
      colors: {
        secondary: {
          value: {
            base: 'red',
            _light: '{colors.blue.500/32}',
            _dark: '{colors.green.500/half}',
          },
        },
      },
    },
  },
})
```

Would incorrectly report:

- [tokens] Missing token: `colors.green.500/half` used in `config.semanticTokens.colors.secondary`
- [tokens] Missing token: `colors.blue.500/32` used in `config.semanticTokens.colors.secondary`

### Added

Allow using namespaced imports

```ts
import * as p from 'styled-system/patterns'
import * as recipes from 'styled-system/recipes'
import * as panda from 'styled-system/css'

// this will now be extracted
p.stack({ mt: '40px' })

recipes.cardStyle({ rounded: true })

panda.css({ color: 'red' })
panda.cva({ base: { color: 'blue' } })
panda.sva({ base: { root: { color: 'green' } } })
```

## [0.34.1] - 2024-03-06

### Fixed

Fix the color opacity modifier syntax for `semanticTokens` inside of conditions

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  conditions: {
    light: '.light &',
    dark: '.dark &',
  },
  theme: {
    tokens: {
      colors: {
        blue: { 500: { value: 'blue' } },
        green: { 500: { value: 'green' } },
      },
      opacity: {
        half: { value: 0.5 },
      },
    },
    semanticTokens: {
      colors: {
        secondary: {
          value: {
            base: 'red',
            _light: '{colors.blue.500/32}', // <-- wasn't working as expected
            _dark: '{colors.green.500/half}',
          },
        },
      },
    },
  },
})
```

will now correctly generate the following CSS:

```css
@layer tokens {
  :where(:root, :host) {
    --colors-blue-500: blue;
    --colors-green-500: green;
    --opacity-half: 0.5;
    --colors-secondary: red;
  }

  .light {
    --colors-secondary: color-mix(in srgb, var(--colors-blue-500) 32%, transparent);
  }

  .dark {
    --colors-secondary: color-mix(in srgb, var(--colors-green-500) 50%, transparent);
  }
}
```

## [0.34.0] - 2024-03-06

### Fixed

- Fix issue where text accent color token was nested incorrectly.
- Fix `splitCssProps` typings, it would sometimes throw
  `Expression produces a union type that is too complex to represent"`
- Fix "missing token" warning when using DEFAULT in tokens path

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  validation: 'error',
  theme: {
    semanticTokens: {
      colors: {
        primary: {
          DEFAULT: { value: '#ff3333' },
          lighter: { value: '#ff6666' },
        },
        background: { value: '{colors.primary}' }, // <-- ⚠️ wrong warning
        background2: { value: '{colors.primary.lighter}' }, // <-- no warning, correct
      },
    },
  },
})
```

### Added

- Add a config validation check to prevent using spaces in token keys, show better error logs when there's a CSS parsing
  error
- Add a warning when using `value` twice in config

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  validation: 'error',
  theme: {
    tokens: {
      colors: {
        primary: { value: '#ff3333' },
      },
    },
    semanticTokens: {
      colors: {
        primary: {
          value: { value: '{colors.primary}' }, // <-- ⚠️ new warning for this
        },
      },
    },
  },
})
```

- Allow using the color opacity modifier syntax (`blue.300/70`) in token references:

1. `{colors.blue.300/70}`
2. `token(colors.blue.300/70)`

Note that this works both in style usage and in build-time config.

```ts
// runtime usage

import { css } from '../styled-system/css'

css({ bg: '{colors.blue.300/70}' })
// => @layer utilities {
//    .bg_token\(colors\.blue\.300\/70\) {
//      background: color-mix(in srgb, var(--colors-blue-300) 70%, transparent);
//    }
//  }

css({ bg: 'token(colors.blue.300/70)' })
// => @layer utilities {
//    .bg_token\(colors\.blue\.300\/70\) {
//      background: color-mix(in srgb, var(--colors-blue-300) 70%, transparent);
//    }
//  }
```

```ts
// build-time usage
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    tokens: {
      colors: {
        blue: {
          300: { value: '#00f' },
        },
      },
    },
    semanticTokens: {
      colors: {
        primary: {
          value: '{colors.blue.300/70}',
        },
      },
    },
  },
})
```

```css
@layer tokens {
  :where(:root, :host) {
    --colors-blue-300: #00f;
    --colors-primary: color-mix(in srgb, var(--colors-blue-300) 70%, transparent);
  }
}
```

### Changed

Deprecates `emitPackage`, it will be removed in the next major version.

## Why?

It's known for causing several issues:

- bundlers sometimes eagerly cache the `node_modules`, leading to `panda codegen` updates to the `styled-system` not
  visible in the browser
- auto-imports are not suggested in your IDE.
- in some IDE the typings are not always reflected properly

## As alternatives, you can use:

- relative paths instead of absolute paths (e.g. `../styled-system/css` instead of `styled-system/css`)
- use [package.json #imports](https://nodejs.org/api/packages.html#subpath-imports) and/or tsconfig path aliases (prefer
  package.json#imports when possible, TS 5.4 supports them by default) like `#styled-system/css` instead of
  `styled-system/css`
- for a [component library](https://panda-css.com/docs/guides/component-library), use a dedicated workspace package
  (e.g. `@acme/styled-system`) and use `importMap: "@acme/styled-system"` so that Panda knows which entrypoint to
  extract, e.g. `import { css } from '@acme/styled-system/css'`

## [0.33.0] - 2024-02-27

### Fixed

- Fix an issue with recipes that lead to in-memory duplication the resulting CSS, which would increase the time taken to
  output the CSS after each extraction in the same HMR session (by a few ms).
- Fix svg token asset quotes
- Fix conditions accessing `Cannot read properties of undefined (reading 'raw')`

### Added

- Allow dynamically recording profiling session by pressing the `p` key in your terminal when using the `--cpu-prof`
  flag for long-running sessions (with `-w` or `--watch` for `panda` / `panda cssgen` / `panda codegen`).
- Add `definePlugin` config functions for type-safety around plugins, add missing `plugins` in config dependencies to
  trigger a config reload on `plugins` change
- Add a `group` to every utility in the `@pandacss/preset-base`, this helps Panda tooling organize utilities.
- Add support for element level css reset via `preflight.level`. Learn more
  [here](https://github.com/chakra-ui/panda/discussions/1992).

Setting `preflight.level` to `'element'` applies the reset directly to the individual elements that have the scope class
assigned.

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: {
    scope: '.my-scope',
    level: 'element', // 'element' | 'parent (default)'
  },
  // ...
})
```

This will generate CSS that looks like:

```css
button.my-scope {
}

img.my-scope {
}
```

This approach allows for more flexibility, enabling selective application of CSS resets either to an entire parent
container or to specific elements within a container.

### Changed

- Unify the token path syntax when using `formatTokenName`

Example with the following config:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  hooks: {
    'tokens:created': ({ configure }) => {
      configure({
        formatTokenName: (path: string[]) => '$' + path.join('-'),
      })
    },
  },
})
```

Will now allow you to use the following syntax for token path:

```diff
- css({ boxShadow: '10px 10px 10px {colors.$primary}' })
+ css({ boxShadow: '10px 10px 10px {$colors-primary}' })

- token.var('colors.$primary')
+ token.var('$colors-black')
```

## [0.32.1] - 2024-02-23

### Fixed

- Fix issue where svg asset tokens doesn't work as expected due to unbalanced quotes.
- Prevent extracting style props of `styled` when not explicitly imported

- Allow using multiple aliases for the same identifier for the `/css` entrypoints just like `/patterns` and `/recipes`

```ts
import { css } from '../styled-system/css'
import { css as css2 } from '../styled-system/css'

css({ display: 'flex' })
css2({ flexDirection: 'column' }) // this wasn't working before, now it does
```

### Added

- Add missing config dependencies for some `styled-system/types` files
- Add a way to create config conditions with nested at-rules/selectors

```ts
export default defaultConfig({
  conditions: {
    extend: {
      supportHover: ['@media (hover: hover) and (pointer: fine)', '&:hover'],
    },
  },
})
```

```ts
import { css } from '../styled-system/css'

css({
  _supportHover: {
    color: 'red',
  },
})
```

will generate the following CSS:

```css
@media (hover: hover) and (pointer: fine) {
  &:hover {
    color: red;
  }
}
```

### Changed

Using colorPalette with DEFAULT values will now also override the current token path

Given this config:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  theme: {
    extend: {
      semanticTokens: {
        colors: {
          bg: {
            primary: {
              DEFAULT: {
                value: '{colors.red.500}',
              },
              base: {
                value: '{colors.green.500}',
              },
              hover: {
                value: '{colors.yellow.300}',
              },
            },
          },
        },
      },
    },
  },
})
```

And this style usage:

```ts
import { css } from 'styled-system/css'

css({
  colorPalette: 'bg.primary',
})
```

This is the difference in the generated css

```diff
@layer utilities {
  .color-palette_bg\\.primary {
+    --colors-color-palette: var(--colors-bg-primary);
    --colors-color-palette-base: var(--colors-bg-primary-base);
    --colors-color-palette-hover: var(--colors-bg-primary-hover);
  }
}
```

Which means you can now directly reference the current `colorPalette` like:

```diff
import { css } from 'styled-system/css'

css({
  colorPalette: 'bg.primary',
+  backgroundColor: 'colorPalette',
})
```

## [0.32.0] - 2024-02-19

### Fixed

- Fix issue in `defineParts` where it silently fails if a part not defined is used. It now errors with a helpful message
- Automatically generate a recipe `compoundVariants` when using `staticCss`
- Fix issue where `0` values doesn't get extracted when used in a condition

### Changed

- Always sort `all` to be first, so that other properties can easily override it
- Switch from `em` to `rem` for breakpoints and container queries to prevent side effects.
- Allow `config.hooks` to be shared in `plugins`

For hooks that can transform Panda's internal state by returning something (like `cssgen:done` and `codegen:prepare`),
each hook instance will be called sequentially and the return result (if any) of the previous hook call is passed to the
next hook so that they can be chained together.

- Allow the user to set `jsxFramework` to any string to enable extracting JSX components.

Context: In a previous version, Panda's extractor used to always extract JSX style props even when not specifying a
`jsxFramework`. This was considered a bug and has been fixed, which reduced the amount of work panda does and artifacts
generated if the user doesn't need jsx.

Now, in some cases like when using Svelte or Astro, the user might still to use & extract JSX style props, but the
`jsxFramework` didn't have a way to specify that. This change allows the user to set `jsxFramework` to any string to
enable extracting JSX components without generating any artifacts.

## [0.31.0] - 2024-02-13

### Fixed

- Fix `styled` factory nested composition with `cva`
- Fix issue in token validation logic where token with additional properties like `description` is considered invalid.
- When `validation` is set to `error`, show all config errors at once instead of stopping at the first error.

### Added

- Add a `RecipeVariant` type to get the variants in a strict object from `cva` function. This complements the
  `RecipeVariantprops` type that extracts the variant as optional props, mostly intended for JSX components.
- Add missing log with the `panda -w` CLI, expose `resolveConfig` from `@pandacss/config`
- Add a `config.polyfill` option that will polyfill the CSS @layer at-rules using a
  [postcss plugin](https://www.npmjs.com/package/@csstools/postcss-cascade-layers)
- And `--polyfill` flag to `panda` and `panda cssgen` commands
- Add `textShadowColor` utility

```ts
css({
  textShadow: '1px 1px 1px var(--text-shadow-color)',
  textShadowColor: 'black',
})
```

### Changed

- Automatically merge the `base` object in the `css` root styles in the runtime
- Sort the longhand/shorthand atomic rules in a deterministic order to prevent property conflicts

This may be a breaking change depending on how your styles are created

Ex:

```ts
css({
  padding: '1px',
  paddingTop: '3px',
  paddingBottom: '4px',
})
```

Will now always generate the following css:

```css
@layer utilities {
  .p_1px {
    padding: 1px;
  }

  .pt_3px {
    padding-top: 3px;
  }

  .pb_4px {
    padding-bottom: 4px;
  }
}
```

## [0.30.02] - 2024-02-08

### Fixed

- Fix issue where `v-model` does not work in vue styled factory
- Fix issue where styled factory in Solid.js could results in `Maximum call stack exceeded` when composing with another
  library that uses the `as` prop.
- Fix issue where the param for `--outdir` was missing, leading to errors

### Added

Allow configuring the `matchTag` / `matchTagProp` functions to customize the way Panda extracts your JSX. This can be
especially useful when working with libraries that have properties that look like CSS properties but are not and should
be ignored.

> **Note**: This feature mostly affects users who have `jsxStyleProps` set to `all`. This is currently the default.
>
> Setting it to `minimal` (which also allows passing the css prop) or `none` (which disables the extraction of CSS
> properties) will make this feature less useful.

Here's an example with Radix UI where the `Select.Content` component has a `position` property that should be ignored:

```tsx
// Here, the `position` property will be extracted because `position` is a valid CSS property
<Select.Content position="popper" sideOffset={5}>
```

```tsx
export default defineConfig({
  // ...
  hooks: {
    'parser:before': ({ configure }) => {
      configure({
        // ignore the Select.Content entirely
        matchTag: (tag) => tag !== 'Select.Content',
        // ...or specifically ignore the `position` property
        matchTagProp: (tag, prop) => tag === 'Select.Content' && prop !== 'position',
      })
    },
  },
})
```

## [0.30.01] - 2024-02-05

### Fixed

Fix the regression caused by the downstream bundle-n-require package, which tries to load custom conditions first. This
led to a `could not resolve @pandacss/dev` error

## [0.30.0] - 2024-02-05

### Fixed

- Fix issue where config changes could not be detected due to config bundling returning stale result sometimes.
- Fix issue where errors were thrown when semantic tokens are overriden in tokens.
- Fix issue where responsive array in css and cva doesn't generate the correct classname

### Added

- Add `utils` functions in the `config:resolved` hook, making it easy to apply transformations after all presets have
  been merged.

For example, this could be used if you want to use most of a preset but want to completely omit a few things, while
keeping the rest. Let's say we want to remove the `stack` pattern from the built-in `@pandacss/preset-base`:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  hooks: {
    'config:resolved': ({ config, utils }) => {
      return utils.omit(config, ['patterns.stack'])
    },
  },
})
```

- Add a `--logfile` flag to the `panda`, `panda codegen`, `panda cssgen` and `panda debug` commands.
- Add a `logfile` option to the postcss plugin

Logs will be streamed to the file specified by the `--logfile` flag or the `logfile` option. This is useful for
debugging issues that occur during the build process.

```sh
panda --logfile ./logs/panda.log
```

```js
module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {
      logfile: './logs/panda.log',
    },
  },
}
```

- Introduce 3 new hooks:

## `tokens:created`

This hook is called when the token engine has been created. You can use this hook to add your format token names and
variables.

> This is especially useful when migrating from other css-in-js libraries, like Stitches.

```ts
export default defineConfig({
  // ...
  hooks: {
    'tokens:created': ({ configure }) => {
      configure({
        formatTokenName: (path) => '$' + path.join('-'),
      })
    },
  },
})
```

## `utility:created`

This hook is called when the internal classname engine has been created. You can override the default `toHash` function
used when `config.hash` is set to `true`

```ts
export default defineConfig({
  // ...
  hooks: {
    'utility:created': ({ configure }) => {
      configure({
        toHash: (paths, toHash) => {
          const stringConds = paths.join(':')
          const splitConds = stringConds.split('_')
          const hashConds = splitConds.map(toHash)
          return hashConds.join('_')
        },
      })
    },
  },
})
```

## `codegen:prepare`

This hook is called right before writing the codegen files to disk. You can use this hook to tweak the codegen files

```ts
export default defineConfig({
  // ...
  hooks: {
    'codegen:prepare': ({ artifacts, changed }) => {
      // do something with the emitted js/d.ts files
    },
  },
})
```

### Changed

- Refactor the `--cpu-prof` profiler to use the `node:inspector` instead of relying on an external module
  (`v8-profiler-next`, which required `node-gyp`)

## [0.29.1] - 2024-01-30

### Fixed

Fix an issue (introduced in v0.29) with `panda init` and add an assert on the new `colorMix` utility function

## [0.29.0] - 2024-01-29

### Fixed

- Fix an issue where the curly token references would not be escaped if the token path was not found.

### Added

**Add config validation**

- Check for duplicate between token & semanticTokens names
- Check for duplicate between recipes/patterns/slots names
- Check for token / semanticTokens paths (must end/contain 'value')
- Check for self/circular token references
- Check for missing tokens references
- Check for conditions selectors (must contain '&')
- Check for breakpoints units (must be the same)

> You can set `validate: 'warn'` in your config to only warn about errors or set it to `none` to disable validation
> entirely.

**Default values in patterns**

You can now set and override `defaultValues` in pattern configurations.

Here's an example of how to define a new `hstack` pattern with a default `gap` value of `40px`:

```js
defineConfig({
  patterns: {
    hstack: {
      properties: {
        justify: { type: 'property', value: 'justifyContent' },
        gap: { type: 'property', value: 'gap' },
      },
      // you can also use a token like '10'
      defaultValues: { gap: '40px' },
      transform(props) {
        const { justify, gap, ...rest } = props
        return {
          display: 'flex',
          alignItems: 'center',
          justifyContent: justify,
          gap,
          ...rest,
        }
      },
    },
  },
})
```

**Media query curly braces tokens**

Add support for token references with curly braces like `{path.to.token}` in media queries, just like the
`token(path.to.token)` alternative already could.

```ts
css({
  // ✅ this is fine now, will resolve to something like
  // `@container (min-width: 56em)`
  '@container (min-width: {sizes.4xl})': {
    color: 'green',
  },
})
```

**Color opacifier**

Update every utilities connected to the `colors` tokens in the `@pandacss/preset-base` (included by default) to use the
[`color-mix`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) CSS function.

This function allows you to mix two colors together, and we use it to change the opacity of a color using the
`{color}/{opacity}` syntax.

You can use it like this:

```ts
css({
  bg: 'red.300/40',
  color: 'white',
})
```

This will generate:

```css
@layer utilities {
  .bg_red\.300\/40 {
    --mix-background: color-mix(in srgb, var(--colors-red-300) 40%, transparent);
    background: var(--mix-background, var(--colors-red-300));
  }

  .text_white {
    color: var(--colors-white);
  }
}
```

- If you're not using any opacity, the utility will not use `color-mix`
- The utility will automatically fallback to the original color if the `color-mix` function is not supported by the
  browser.
- You can use any of the color tokens, and any of the opacity tokens.

---

The `utilities` transform function also receives a new `utils` object that contains the `colorMix` function, so you can
also use it on your own utilities:

```ts
export default defineConfig({
  utilities: {
    background: {
      shorthand: 'bg',
      className: 'bg',
      values: 'colors',
      transform(value, args) {
        const mix = args.utils.colorMix(value)
        // This can happen if the value format is invalid (e.g. `bg: red.300/invalid` or `bg: red.300//10`)
        if (mix.invalid) return { background: value }

        return {
          background: mix.value,
        }
      },
    },
  },
})
```

---

Here's a cool snippet (that we use internally !) that makes it easier to create a utility transform for a given
property:

```ts
import type { PropertyTransform } from '@pandacss/types'

export const createColorMixTransform =
  (prop: string): PropertyTransform =>
  (value, args) => {
    const mix = args.utils.colorMix(value)
    if (mix.invalid) return { [prop]: value }

    const cssVar = '--mix-' + prop

    return {
      [cssVar]: mix.value,
      [prop]: `var(${cssVar}, ${mix.color})`,
    }
  }
```

then the same utility transform as above can be written like this:

```ts
export default defineConfig({
  utilities: {
    background: {
      shorthand: 'bg',
      className: 'bg',
      values: 'colors',
      transform: createColorMixTransform('background'),
    },
  },
})
```

**Container queries Theme**

Improve support for CSS container queries by adding a new `containerNames` and `containerSizes` theme options.

You can new define container names and sizes in your theme configuration and use them in your styles.

```ts
export default defineConfig({
  // ...
  theme: {
    extend: {
      containerNames: ['sidebar', 'content'],
      containerSizes: {
        xs: '40em',
        sm: '60em',
        md: '80em',
      },
    },
  },
})
```

The default container sizes in the `@pandacss/preset-panda` preset are shown below:

```ts
export const containerSizes = {
  xs: '320px',
  sm: '384px',
  md: '448px',
  lg: '512px',
  xl: '576px',
  '2xl': '672px',
  '3xl': '768px',
  '4xl': '896px',
  '5xl': '1024px',
  '6xl': '1152px',
  '7xl': '1280px',
  '8xl': '1440px',
}
```

Then use them in your styles by referencing using `@<container-name>/<container-size>` syntax:

> The default container syntax is `@/<container-size>`.

```ts
import { css } from '/styled-system/css'

function Demo() {
  return (
    <nav className={css({ containerType: 'inline-size' })}>
      <div
        className={css({
          fontSize: { '@/sm': 'md' },
        })}
      />
    </nav>
  )
}
```

This will generate the following CSS:

```css
.cq-type_inline-size {
  container-type: inline-size;
}

@container (min-width: 60em) {
  .\@\/sm:fs_md {
    container-type: inline-size;
  }
}
```

**Container Query Pattern**

To make it easier to use container queries, we've added a new `cq` pattern to `@pandacss/preset-base`.

```ts
import { cq } from 'styled-system/patterns'

function Demo() {
  return (
    <nav className={cq()}>
      <div
        className={css({
          fontSize: { base: 'lg', '@/sm': 'md' },
        })}
      />
    </nav>
  )
}
```

You can also named container queries:

```ts
import { cq } from 'styled-system/patterns'

function Demo() {
  return (
    <nav className={cq({ name: 'sidebar' })}>
      <div
        className={css({
          fontSize: { base: 'lg', '@sidebar/sm': 'md' },
        })}
      />
    </nav>
  )
}
```

**Config**

- Add support for explicitly specifying config related files that should trigger a context reload on change.

  > We automatically track the config file and (transitive) files imported by the config file as much as possible, but
  > sometimes we might miss some. You can use this option as a workaround for those edge cases.

  Set the `dependencies` option in `panda.config.ts` to a glob or list of files.

  ```ts
  export default defineConfig({
    // ...
    dependencies: ['path/to/files/**.ts'],
  })
  ```

- Invoke `config:change` hook in more situations (when the `--watch` flag is passed to `panda codegen`, `panda cssgen`,
  `panda ship`)

- Watch for more config options paths changes, so that the related artifacts will be regenerated a bit more reliably
  (ex: updating the `config.hooks` will now trigger a full regeneration of `styled-system`)

### Changed

- Set `display: none` for hidden elements in `reset` css
- Updated the default preset in Panda to use the new `defaultValues` feature.

To override the default values, consider using the `extend` pattern.

```js
defineConfig({
  patterns: {
    extend: {
      stack: {
        defaultValues: { gap: '20px' },
      },
    },
  },
})
```

## [0.28.0] - 2024-01-24

### Fixed

- Allow custom logo in studio
- Update `getArbitraryValue` so it works for values that start on a new line
- Fix issue where `/* @__PURE__ */` annotation threw a warning in Vite build due to incorrect placement.
- Fix a typing issue where the `borderWidths` wasn't specified in the generated `TokenCategory` type
- Fix issue where throws "React is not defined error"
- Fix a regression with rule insertion order after triggering HMR that re-uses some CSS already generated in previous
  triggers, introuced in v0.27.0
- Fix the issue in the utility configuration where shorthand without `className` returns incorrect CSS when using the
  shorthand version.

```js
utilities: {
  extend: {
    coloredBorder: {
      shorthand: 'cb', // no classname, returns incorrect css
      values: ['red', 'green', 'blue'],
      transform(value) {
        return {
          border: `1px solid ${value}`,
        };
      },
    },
  },
},
```

- Fix a regression with globalCss selector order

```ts
{
    globalCss: {
        html: {
          ".aaa": {
            color: "red.100",
            "& .bbb": {
              color: "red.200",
              "& .ccc": {
                color: "red.300"
              }
            }
          }
        },
    }
}
```

would incorrectly generate (regression introduced in v0.26.2)

```css
.aaa html {
  color: var(--colors-red-100);
}

.aaa html .bbb {
  color: var(--colors-red-200);
}

.aaa html .bbb .ccc {
  color: var(--colors-red-300);
}
```

will now correctly generate again:

```css
html .aaa {
  color: var(--colors-red-100);
}

html .aaa .bbb {
  color: var(--colors-red-200);
}

html .aaa .bbb .ccc {
  color: var(--colors-red-300);
}
```

### Added

- Add a `--cpu-prof` flag to `panda`, `panda cssgen`, `panda codegen` and `panda debug` commands This is useful for
  debugging performance issues in `panda` itself. This will generate a `panda-{command}-{timestamp}.cpuprofile` file in
  the current working directory, which can be opened in tools like [Speedscope](https://www.speedscope.app/)
- Slight perf improvement by caching a few computed properties that contains a loop

This is mostly intended for maintainers or can be asked by maintainers to help debug issues.

### Changed

Refactor `config.hooks` to be much more powerful, you can now:

- Tweak the config after it has been resolved (after presets are loaded and merged), this could be used to dynamically
  load all `recipes` from a folder
- Transform a source file's content before parsing it, this could be used to transform the file content to a
  `tsx`-friendly syntax so that Panda's parser can parse it.
- Implement your own parser logic and add the extracted results to the classic Panda pipeline, this could be used to
  parse style usage from any template language
- Tweak the CSS content for any `@layer` or even right before it's written to disk (if using the CLI) or injected
  through the postcss plugin, allowing all kinds of customizations like removing the unused CSS variables, etc.
- React to any config change or after the codegen step (your outdir, the `styled-system` folder) have been generated

See the list of available `config.hooks` here:

```ts
export interface PandaHooks {
  /**
   * Called when the config is resolved, after all the presets are loaded and merged.
   * This is the first hook called, you can use it to tweak the config before the context is created.
   */
  'config:resolved': (args: { conf: LoadConfigResult }) => MaybeAsyncReturn
  /**
   * Called when the Panda context has been created and the API is ready to be used.
   */
  'context:created': (args: { ctx: ApiInterface; logger: LoggerInterface }) => void
  /**
   * Called when the config file or one of its dependencies (imports) has changed.
   */
  'config:change': (args: { config: UserConfig }) => MaybeAsyncReturn
  /**
   * Called after reading the file content but before parsing it.
   * You can use this hook to transform the file content to a tsx-friendly syntax so that Panda's parser can parse it.
   * You can also use this hook to parse the file's content on your side using a custom parser, in this case you don't have to return anything.
   */
  'parser:before': (args: { filePath: string; content: string }) => string | void
  /**
   * Called after the file styles are extracted and processed into the resulting ParserResult object.
   * You can also use this hook to add your own extraction results from your custom parser to the ParserResult object.
   */
  'parser:after': (args: { filePath: string; result: ParserResultInterface | undefined }) => void
  /**
   * Called after the codegen is completed
   */
  'codegen:done': () => MaybeAsyncReturn
  /**
   * Called right before adding the design-system CSS (global, static, preflight, tokens, keyframes) to the final CSS
   * Called right before writing/injecting the final CSS (styles.css) that contains the design-system CSS and the parser CSS
   * You can use it to tweak the CSS content before it's written to disk or injected through the postcss plugin.
   */
  'cssgen:done': (args: {
    artifact: 'global' | 'static' | 'reset' | 'tokens' | 'keyframes' | 'styles.css'
    content: string
  }) => string | void
}
```

## [0.27.3] - 2024-01-18

### Fixed

- Fix issue where HMR doesn't work when tsconfig paths is used.
- Fix `prettier` parser warning in panda config setup.

## [0.27.2] - 2024-01-17

### Fixed

Switch back to `node:path` from `pathe` to resolve issues with windows path in PostCSS + Webpack set up

## [0.27.1] - 2024-01-15

### Fixed

Fix issue in windows environments where HMR doesn't work in webpack projects.

## [0.27.0] - 2024-01-14

### Added

- Introduce a new `config.lightningcss` option to use `lightningcss` (currently disabled by default) instead of
  `postcss`.
- Add a new `config.browserslist` option to configure the browserslist used by `lightningcss`.
- Add a `--lightningcss` flag to the `panda` and `panda cssgen` command to use `lightningcss` instead of `postcss` for
  this run.
- Add support for aspect ratio tokens in the panda config or preset. Aspect ratio tokens are used to define the aspect
  ratio of an element.

```js
export default defineConfig({
  // ...
  theme: {
    extend: {
      // add aspect ratio tokens
      tokens: {
        aspectRatios: {
          '1:1': '1',
          '16:9': '16/9',
        },
      },
    },
  },
})
```

Here's what the default aspect ratio tokens in the base preset looks like:

```json
{
  "square": { "value": "1 / 1" },
  "landscape": { "value": "4 / 3" },
  "portrait": { "value": "3 / 4" },
  "wide": { "value": "16 / 9" },
  "ultrawide": { "value": "18 / 5" },
  "golden": { "value": "1.618 / 1" }
}
```

**Breaking Change**

The built-in token values has been removed from the `aspectRatio` utility to the `@pandacss/preset-base` as a token.

For most users, this change should be a drop-in replacement. However, if you used a custom preset in the config, you
might need to update it to include the new aspect ratio tokens.

### Changed

- Enhance `splitCssProps` typings
- Improve the performance of the runtime transform functions by caching their results (css, cva, sva, recipe/slot
  recipe, patterns)

> See detailed breakdown of the performance improvements
> [here](https://github.com/chakra-ui/panda/pull/1986#issuecomment-1887459483) based on the React Profiler.

- Change the config dependencies (files that are transitively imported) detection a bit more permissive to make it work
  by default in more scenarios.

**Context**

This helps when you're in a monorepo and you have a workspace package for your preset, and you want to see the HMR
reflecting changes in your app.

Currently, we only traverse files with the `.ts` extension, this change makes it traverse all files ending with `.ts`,
meaning that it will also traverse `.d.ts`, `.d.mts`, `.mts`, etc.

**Example**

```ts
// apps/storybook/panda.config.ts
import { defineConfig } from '@pandacss/dev'
import preset from '@acme/preset'

export default defineConfig({
  // ...
})
```

This would not work before, but now it does.

```jsonc
{
  "name": "@acme/preset",
  "types": "./dist/index.d.mts", // we only looked into `.ts` files, so we didnt check this
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
}
```

**Notes** This would have been fine before that change.

```jsonc
// packages/preset/package.json
{
  "name": "@acme/preset",
  "types": "./src/index.ts", // this was fine
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
    },
    // ...
  },
}
```

## [0.26.2] - 2024-01-10

### Fixed

Fix `placeholder` condition in `preset-base`

## [0.26.1] - 2024-01-09

### Fixed

Hotfix `strictTokens` after introducing `strictPropertyValues`

## [0.26.0] - 2024-01-09

### Fixed

- Fix issue where `[]` escape hatch clashed with named grid lines
- Fix `@pandacss/postcss` plugin regression when the entry CSS file (with `@layer` rules order) contains user-defined
  rules, those user-defined rules would not be reloaded correctly after being changed.
- Fix an edge-case for when the `config.outdir` would not be set in the `panda.config`

Internal details: The `outdir` would not have any value after a config change due to the fallback being set in the
initial config resolving code path but not in context reloading code path, moving it inside the config loading function
fixes this issue.

### Added

- Add `data-placeholder` and `data-placeholder-shown` to `preset-base` conditions
- Display better CssSyntaxError logs
- Add `borderWidths` token to types

### Changed

- Remove eject type from presets
- Refactors the parser and import analysis logic. The goal is to ensure we can re-use the import logic in ESLint Plugin
  and Node.js.
- `config.strictTokens` will only affect properties that have config tokens, such as `color`, `bg`, `borderColor`, etc.
- `config.strictPropertyValues` is added and will throw for properties that do not have config tokens, such as
  `display`, `content`, `willChange`, etc. when the value is not a predefined CSS value.

In version
[0.19.0 we changed `config.strictTokens`](https://github.com/chakra-ui/panda/blob/main/CHANGELOG.md#0190---2023-11-24)
typings a bit so that the only property values allowed were the config tokens OR the predefined CSS values, ex: `flex`
for the property `display`, which prevented typos such as `display: 'aaa'`.

The problem with this change is that it means you would have to provide every CSS properties a given set of values so
that TS wouldn't throw any error. Thus, we will partly revert this change and make it so that `config.strictTokens`
shouldn't affect properties that do not have config tokens, such as `content`, `willChange`, `display`, etc.

v0.19.0:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ❌ would throw since 'abc' is not part of predefined values of 'display' even thought there is no config token for 'abc'
```

now:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ✅ will not throw there is no config token for 'abc'
```

Instead, if you want the v.19.0 behavior, you can use the new `config.strictPropertyValues` option. You can combine it
with `config.strictTokens` if you want to be strict on both properties with config tokens and properties without config
tokens.

The new `config.strictPropertyValues` option will only be applied to this exhaustive list of properties:

```ts
type StrictableProps =
  | 'alignContent'
  | 'alignItems'
  | 'alignSelf'
  | 'all'
  | 'animationComposition'
  | 'animationDirection'
  | 'animationFillMode'
  | 'appearance'
  | 'backfaceVisibility'
  | 'backgroundAttachment'
  | 'backgroundClip'
  | 'borderCollapse'
  | 'border'
  | 'borderBlock'
  | 'borderBlockEnd'
  | 'borderBlockStart'
  | 'borderBottom'
  | 'borderInline'
  | 'borderInlineEnd'
  | 'borderInlineStart'
  | 'borderLeft'
  | 'borderRight'
  | 'borderTop'
  | 'borderBlockEndStyle'
  | 'borderBlockStartStyle'
  | 'borderBlockStyle'
  | 'borderBottomStyle'
  | 'borderInlineEndStyle'
  | 'borderInlineStartStyle'
  | 'borderInlineStyle'
  | 'borderLeftStyle'
  | 'borderRightStyle'
  | 'borderTopStyle'
  | 'boxDecorationBreak'
  | 'boxSizing'
  | 'breakAfter'
  | 'breakBefore'
  | 'breakInside'
  | 'captionSide'
  | 'clear'
  | 'columnFill'
  | 'columnRuleStyle'
  | 'contentVisibility'
  | 'direction'
  | 'display'
  | 'emptyCells'
  | 'flexDirection'
  | 'flexWrap'
  | 'float'
  | 'fontKerning'
  | 'forcedColorAdjust'
  | 'isolation'
  | 'lineBreak'
  | 'mixBlendMode'
  | 'objectFit'
  | 'outlineStyle'
  | 'overflow'
  | 'overflowX'
  | 'overflowY'
  | 'overflowBlock'
  | 'overflowInline'
  | 'overflowWrap'
  | 'pointerEvents'
  | 'position'
  | 'resize'
  | 'scrollBehavior'
  | 'touchAction'
  | 'transformBox'
  | 'transformStyle'
  | 'userSelect'
  | 'visibility'
  | 'wordBreak'
  | 'writingMode'
```

## [0.25.0] - 2024-01-06

### Fixed

- Fix config dependencies detection by re-introducing the file tracing utility
- Fix issue where `base` doesn't work within css function

```jsx
css({
  // This didn't work, but now it does
  base: { color: 'blue' },
})
```

## Added

- Add a way to generate the staticCss for _all_ recipes (and all variants of each recipe)

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  staticCss: {
    recipes: '*', // ✅ will generate the staticCss for all recipes
  },
})
```

- Support token reference syntax when authoring styles object, text styles and layer styles.

```jsx
import { css } from '../styled-system/css'

const styles = css({
  border: '2px solid {colors.primary}',
})
```

This will resolve the token reference and convert it to css variables.

```css
.border_2px_solid_\{colors\.primary\} {
  border: 2px solid var(--colors-primary);
}
```

The alternative to this was to use the `token(...)` css function which will be resolved.

### `token(...)` vs `{...}`

Both approaches return the css variable

```jsx
const styles = css({
  // token reference syntax
  border: '2px solid {colors.primary}',
  // token function syntax
  border: '2px solid token(colors.primary)',
})
```

However, The `token(...)` syntax allows you to set a fallback value.

```jsx
const styles = css({
  border: '2px solid token(colors.primary, red)',
})
```

## [0.24.2] - 2024-01-04

### Fixed

- Fix a regression with utility where boolean values would be treated as a string, resulting in "false" being seen as a
  truthy value
- Fix an issue with the `panda init` command which didn't update existing `.gitignore` to include the `styled-system`
- Fix issue where config slot recipes with compound variants were not processed correctly

## [0.24.1] - 2024-01-02

### Fixed

- Fix an issue with the `@pandacss/postcss` (and therefore `@pandacss/astro`) where the initial @layer CSS wasn't
  applied correctly
- Fix an issue with `staticCss` where it was only generated when it was included in the config (we can generate it
  through the config recipes)

## [0.24.0] - 2024-01-02

### Fixed

- Fix regression in previous implementation that increased memory usage per extraction, leading to slower performance
  over time

### Added

Add `patterns` to `config.staticCss`

### Changed

- Boost style extraction performance by moving more work away from postcss
- Using a hashing strategy, the compiler only computes styles/classname once per style object and prop-value-condition
  pair
- Fix the special `[*]` rule which used to generate the same rule for every breakpoints, which is not what most people
  need (it's still possible by explicitly using `responsive: true`).

```ts
const card = defineRecipe({
  className: 'card',
  base: { color: 'white' },
  variants: {
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
    visual: {
      primary: { backgroundColor: 'blue' },
      secondary: { backgroundColor: 'gray' },
    },
  },
})

export default defineConfig({
  // ...
  staticCss: {
    recipes: {
      card: ['*'], // this

      // was equivalent to:
      card: [
        // notice how `responsive: true` was implicitly added
        { size: ['*'], responsive: true },
        { visual: ['*'], responsive: true },
      ],

      //   will now correctly be equivalent to:
      card: [{ size: ['*'] }, { visual: ['*'] }],
    },
  },
})
```

Here's the diff in the generated CSS:

```diff
@layer recipes {
  .card--size_small {
    font-size: 14px;
  }

  .card--size_large {
    font-size: 18px;
  }

  .card--visual_primary {
    background-color: blue;
  }

  .card--visual_secondary {
    background-color: gray;
  }

  @layer _base {
    .card {
      color: var(--colors-white);
    }
  }

-  @media screen and (min-width: 40em) {
-    -.sm\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.sm\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.sm\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.sm\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 48em) {
-    -.md\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.md\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.md\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.md\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 64em) {
-    -.lg\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.lg\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.lg\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.lg\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 80em) {
-    -.xl\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.xl\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.xl\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.xl\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }

-  @media screen and (min-width: 96em) {
-    -.\32xl\:card--size_small {
-      -font-size: 14px;
-    -}
-    -.\32xl\:card--size_large {
-      -font-size: 18px;
-    -}
-    -.\32xl\:card--visual_primary {
-      -background-color: blue;
-    -}
-    -.\32xl\:card--visual_secondary {
-      -background-color: gray;
-    -}
-  }
}
```

## [0.23.0] - 2023-12-15

### Fixed

- Fix issue where style props wouldn't be properly passed when using `config.jsxStyleProps` set to `minimal` or `none`
  with JSX patterns (`Box`, `Stack`, `Flex`, etc.)
- Fix an issue with config change detection when using a custom `config.slotRecipes[xxx].jsx` array
- Fix performance issue where process could get slower due to postcss rules held in memory.
- Fix an issue with the postcss plugin when a config change sometimes didn't trigger files extraction
- Fix & perf improvement: skip JSX parsing when not using `config.jsxFramework` / skip tagged template literal parsing
  when not using `config.syntax` set to "template-literal"
- Fix a parser issue where we didn't handle import aliases when using a {xxx}.raw() function.

ex:

```ts
// button.stories.ts
import { button as buttonRecipe } from '@ui/styled-system/recipes'

export const Primary: Story = {
  // ❌ this wouldn't be parsed as a recipe because of the alias + .raw()
  //  -> ✅ it's now fixed
  args: buttonRecipe.raw({
    color: 'primary',
  }),
}
```

### Added

- Add support for emit-pkg command to emit just the `package.json` file with the required entrypoints. If an existing
  `package.json` file is present, the `exports` field will be updated.

When setting up Panda in a monorepo, this command is useful in monorepo setups where you want the codegen to run only in
a dedicated workspace package.

- Automatically extract/generate CSS for `sva` even if `slots` are not statically extractable, since it will only
  produce atomic styles, we don't care much about slots for `sva` specifically

Currently the CSS won't be generated if the `slots` are missing which can be problematic when getting them from another
file, such as when using `Ark-UI` like `import { comboboxAnatomy } from '@ark-ui/anatomy'`

```ts
import { sva } from '../styled-system/css'
import { slots } from './slots'

const card = sva({
  slots, // ❌ did NOT work -> ✅ will now work as expected
  base: {
    root: {
      p: '6',
      m: '4',
      w: 'md',
      boxShadow: 'md',
      borderRadius: 'md',
      _dark: { bg: '#262626', color: 'white' },
    },
    content: {
      textStyle: 'lg',
    },
    title: {
      textStyle: 'xl',
      fontWeight: 'semibold',
      pb: '2',
    },
  },
})
```

### Changed

- Log stacktrace on error instead of only logging the message

## [0.22.1] - 2023-12-15

### Fixed

- Fix `slotRecipes` typings, [the recently added `recipe.staticCss`](https://github.com/chakra-ui/panda/pull/1765) added
  to `config.recipes` weren't added to `config.slotRecipes`
- Fix a typing issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with property-based
  conditionals

```ts
css({
  bg: '[#3B00B9]', // ✅ was okay
  _dark: {
    // ✅ was okay
    color: '[#3B00B9]',
  },

  // ❌ Not okay, will be fixed in this patch
  color: {
    _dark: '[#3B00B9]',
  },
})
```

- Fix a regression with the @pandacss/astro integration where the automatically provided `base.css` would be ignored by
  the @pandacss/postcss plugin

- Fix a CSS generation issue with `config.strictTokens` when using the `[xxx]` escape-hatch syntax with `!` or
  `!important`

```ts
css({
  borderWidth: '[2px!]',
  width: '[2px !important]',
})
```

## [0.22.0] - 2023-12-14

### Fixed

- Fix issue where static-css types was not exported.
- Fix conditional variables in border radii
- Fix regression where `styled-system/jsx/index` had the wrong exports
- Fix potential cross-platform issues with path resolving by using `pathe` instead of `path`
- Fix issue where `children` does not work in styled factory's `defaultProps` in React, Preact and Qwik
- Fixes a missing bracket in \_indeterminate condition
- Fix issue where array syntax did not generate reponsive values in mapped pattern properties

### Changed

- Update csstype to support newer css features
- Redesign astro integration and studio to use the new Astro v4 (experimental) JavaScript API
- Update Astro version to v4 for the @pandacss/studio

- Improve initial css extraction time by at least 5x 🚀

  Initial extraction time can get slow when using static CSS with lots of recipes or parsing a lot of files.

  **Scenarios**

  - Park UI went from 3500ms to 580ms (6x faster)
  - Panda Website went from 2900ms to 208ms (14x faster)

  **Potential Breaking Change**

  If you use `hooks` in your `panda.config` file to listen for when css is extracted, we no longer return the `css`
  string for performance reasons. We might reconsider this in the future.

## [0.21.0] - 2023-12-09

### Fixed

- Fix static extraction issue when using JSX attributes (props) that are other JSX nodes

While parsing over the AST Nodes, due to an optimization where we skipped retrieving the current JSX element and instead
kept track of the latest one, the logic was flawed and did not extract other properties after encountering a JSX
attribute that was another JSX node.

```tsx
const Component = () => {
  return (
    <>
      {/* ❌ this wasn't extracting ml="2" */}
      <Flex icon={<svg className="icon" />} ml="2" />

      {/* ✅ this was fine */}
      <Stack ml="4" icon={<div className="icon" />} />
    </>
  )
}
```

Now both will be fine again.

- Fix an edge-case when Panda eagerly extracted and tried to generate the CSS for a JSX property that contains an URL.

```tsx
const App = () => {
  // here the content property is a valid CSS property, so Panda will try to generate the CSS for it
  // but since it's an URL, it would produce invalid CSS
  // we now check if the property value is an URL and skip it if needed
  return <CopyButton content="https://www.buymeacoffee.com/grizzlycodes" />
}
```

- Fix an issue where recipe variants that clash with utility shorthand don't get generated due to the normalization that
  happens internally.
- Fix issue where Preact JSX types are not merging recipes correctly
- Fix vue `styled` factory internal class merging, for example:

```js
<script setup>
import { styled } from '../styled-system/jsx'

const StyledButton = styled('button', {
  base: {
    bgColor: 'red.300',
  },
})
</script>
<template>
  <StyledButton id="test" class="test">
    <slot></slot>
  </StyledButton>
</template>
```

Will now correctly include the `test` class in the final output.

### Added

- Add `configPath` and `cwd` options in the `@pandacss/astro` integration just like in the `@pandacss/postcss`

> This can be useful with Nx monorepos where the `panda.config.ts` is not in the root of the project.

- Add an escape-hatch for arbitrary values when using `config.strictTokens`, by prefixing the value with `[` and
  suffixing with `]`, e.g. writing `[123px]` as a value will bypass the token validation.

```ts
import { css } from '../styled-system/css'

css({
  // @ts-expect-error TS will throw when using from strictTokens: true
  color: '#fff',
  // @ts-expect-error TS will throw when using from strictTokens: true
  width: '100px',

  // ✅ but this is now allowed:
  bgColor: '[rgb(51 155 240)]',
  fontSize: '[12px]',
})
```

- Add a shortcut for the `config.importMap` option

You can now also use a string to customize the base import path and keep the default entrypoints:

```json
{
  "importMap": "@scope/styled-system"
}
```

is the equivalent of:

```json
{
  "importMap": {
    "css": "@scope/styled-system/css",
    "recipes": "@scope/styled-system/recipes",
    "patterns": "@scope/styled-system/patterns",
    "jsx": "@scope/styled-system/jsx"
  }
}
```

- Add a way to specify a recipe's `staticCss` options from inside a recipe config, e.g.:

```js
import { defineRecipe } from '@pandacss/dev'

const card = defineRecipe({
  className: 'card',
  base: { color: 'white' },
  variants: {
    size: {
      small: { fontSize: '14px' },
      large: { fontSize: '18px' },
    },
  },
  staticCss: [{ size: ['*'] }],
})
```

would be the equivalent of defining it inside the main config:

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  staticCss: {
    recipes: {
      card: {
        size: ['*'],
      },
    },
  },
})
```

- Add Open Props preset

## [0.20.1] - 2023-12-01

### Fixed

- Fix issue where conditional recipe variant doesn't work as expected
- Fix issue with the `token(xxx.yyy)` fn used in AtRule, things like:

```ts
css({
  '@container (min-width: token(sizes.xl))': {
    color: 'green.300',
  },
  '@media (min-width: token(sizes.2xl))': {
    color: 'red.300',
  },
})
```

### Added

- Add a --watch flag to the `panda ship` command
- Add support for granular config change detection
- Improve the `codegen` experience by only rewriting files affecteds by a config change
- Added `strokeWidth` to svg utilities.
- Connected `outlineWidth` utility to `borderWidths` token.
- Add `borderWidth`, `borderTopWidth`, `borderLeftWidth`, `borderRightWidth`, `borderBottomWidth` to berder utilities.
- Add support for `staticCss` in presets allowing you create sharable, pre-generated styles
- Add support for extending `staticCss` defined in presets

```jsx
const presetWithStaticCss = definePreset({
  staticCss: {
    recipes: {
      // generate all button styles and variants
      button: ['*'],
    },
  },
})

export default defineConfig({
  presets: [presetWithStaticCss],
  staticCss: {
    extend: {
      recipes: {
        // extend and pre-generate all sizes for card
        card: [{ size: ['small', 'medium', 'large'] }],
      },
    },
  },
})
```

## [0.19.0] - 2023-11-24

### Fixed

- Fix issue where typescript error is shown in recipes when `exactOptionalPropertyTypes` is set.
  > To learn more about this issue, see [this issue](https://github.com/chakra-ui/panda/issues/1688)
- Fix issue in preflight where monospace fallback pointed to the wrong variable
- Fix issue where css variables were not supported in layer styles and text styles types.
- Fix issue where recipe artifacts might not match the recipes defined in the theme due to the internal cache not being
  cleared as needed.

### Changed

- Require explicit installation of `@pandacss/studio` to use the `panda studio` command.
- Improves the `config.strictTokens` type-safety by allowing CSS predefined values (like 'flex' or 'block' for the
  property 'display') and throwing when using anything else than those, if no theme tokens was found on that property.

Before:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ❌ didn't throw even though 'abc' is not a valid value for 'display'
```

Now:

```ts
// config.strictTokens = true
css({ display: 'flex' }) // OK, didn't throw
css({ display: 'block' }) // OK, didn't throw
css({ display: 'abc' }) // ✅ will throw since 'abc' is not a valid value for 'display'
```

## [0.18.3] - 2023-11-15

### Fixed

- Fix issue with `forceConsistentTypeExtension` where the `composition.d.mts` had an incorrect type import
- Fix issue in studio here userland `@ark-ui/react` version could interfere with studio version

## [0.18.2] - 2023-11-10

### Fixed

- Fix regression in grid pattern where `columns` doesn't not work as expected.

## [0.18.1] - 2023-11-09

### Fixed

- Fix issue where virtual color does not apply DEFAULT color in palette
- Fix issue where composite tokens (shadows, border, etc) generated incorrect css when using the object syntax in
  semantic tokens.
- Fix issue where `hideBelow` breakpoints are inclusive of the specified breakpoints
- Fix an issue with the `grid` pattern from @pandacss/preset-base (included by default), setting a minChildWidth wasn't
  interpreted as a token value

Before:

```tsx
<div className={grid({ minChildWidth: '80px', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))

<div className={grid({ minChildWidth: '20', gap: 8 })} />
// ❌ grid-template-columns: repeat(auto-fit, minmax(20, 1fr))
//                                                  ^^^
```

After:

```tsx
<div className={grid({ minChildWidth: '80px', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))

<div className={grid({ minChildWidth: '20', gap: 8 })} />
// ✅ grid-template-columns: repeat(auto-fit, minmax(var(--sizes-20, 20), 1fr))
//                                                  ^^^^^^^^^^^^^^^^^^^
```

```jsx
css({ hideBelow: 'lg' })
// => @media screen and (max-width: 63.9975em) { background: red; }
```

### Added

- Support arbitrary breakpoints in `hideBelow` and `hideFrom` utilities

```jsx
css({ hideFrom: '800px' })
// => @media screen and (min-width: 800px) { background: red; }
```

### Changed

- Make `_required`condition target `[data-required]` and `[aria-required=true]` attributes

## [0.18.0] - 2023-11-06

### Fixed

- Fix issue in template literal mode where comma-separated selectors don't work when multiline
- Fix CLI interactive mode `syntax` question values and prettify the generated `panda.config.ts` file
- Improve semantic colors in studio

### Added

- Add a `--only-config` flag for the `panda debug` command, to skip writing app files and just output the resolved
  config.
- Add `--strict-tokens` flag and question in the interactive CLI
- Add a `splitCssProps` utility exported from the {outdir}/jsx entrypoint

```tsx
import { splitCssProps, styled } from '../styled-system/jsx'
import type { HTMLStyledProps } from '../styled-system/types'

function SplitComponent({ children, ...props }: HTMLStyledProps<'div'>) {
  const [cssProps, restProps] = splitCssProps(props)
  return (
    <styled.div {...restProps} className={css({ display: 'flex', height: '20', width: '20' }, cssProps)}>
      {children}
    </styled.div>
  )
}

// Usage

function App() {
  return <SplitComponent margin="2">Click me</SplitComponent>
}
```

### Changed

- Perf: use raw `if` instead of ts-pattern in the extractor (hot path)

## [0.17.5] - 2023-10-31

### Fixed

- Fix issue where Solid.js styled factory fails with pattern styles includes a css variable (e.g. Divider)
- Fix issue where error is thrown for semantic tokens with raw values.
- Fix issue where using array syntax in config recipe generates invalid css
- Fix issue where cva composition in styled components doens't work as expected.

### Changed

- Ensure dir exists before writing file for the `panda cssgen` / `panda ship` / `panda analyze` commands when specifying
  an outfile.

## [0.17.4] - 2023-10-30

### Fixed

- Display semantic colors correctly in studio.
- Fix issue where types package was not built correctly.

## [0.17.3] - 2023-10-28

### Fixed

- Fix regression in types due to incorrect `package.json` structure
- Fix issue in studio command where `fs-extra` imports could not be resolved.
- Fix an issue with the Postcss builder config change detection, which triggered unnecessary a rebuild of the artifacts.

### CHanged

- Mark `defineTokens` and `defineSemanticTokens` with pure annotation to treeshake from bundle when using within
  component library.

## [0.17.2] - 2023-10-27

### Fixed

Fix an issue with the CLI, using the dev mode instead of the prod mode even when installed from npm.

This resolves the following errors:

```
 Error: Cannot find module 'resolve.exports'
```

```
Error: Cannot find module './src/cli-main'
```

## [0.17.1] - 2023-10-26

### Fixed

- Fix persistent error that causes CI builds to fail due to PostCSS plugin emitting artifacts in the middle of a build
  process.
- Fix issue where conditions don't work in semantic tokens when using template literal syntax.
- Fix issue in reset styles where button does not inherit color style
- Fix issue where FileSystem writes cause intermittent errors in different build contexts (Vercel, Docker). This was
  solved by limiting the concurrency using the `p-limit` library
- Fix issue where using scale css property adds an additional 'px'
- Fix issue where styled objects are sometimes incorrectly merged, leading to extraneous classnames in the DOM

### Added

- Add `--host` and `--port` flags to studio.

### Changed

- Change `OmittedHTMLProps` to be empty when using `config.jsxStyleProps` as `minimal` or `none`
- Remove export types from jsx when no jsxFramework configuration
- Extract identifier values coming from an `EnumDeclaration` member

Example:

```ts
enum Color {
  Red = 'red.400',
  Blue = 'blue.400',
}

const className = css({ color: Color.Red, backgroundColor: Color['Blue'] })
```

- Use predefined interfaces instead of relying on automatic TS type inference or type aliases. This should result in
  snappier

This should fix issues with the generation of typescript declaration (`.d.ts`) files when using `@pandacss/xxx` packages
directly, such as:

```
src/config.ts(21,14): error TS2742: The inferred type of 'tokens' cannot be named without a reference to '../node_modules/@pandacss/types/src/shared'. This is likely not portable. A type annotation is necessa…
```

> These changes are only relevant if you are directly using **other** Panda `@pandacss/xxx` packages than the
> `@pandacss/dev`.

## [0.17.0] - 2023-10-20

### Fixed

- Fix an issue with the `@layer tokens` CSS declarations when using `cssVarRoot` with multiple selectors, like
  `root, :host, ::backdrop`

### Added

- Improve support for styled element composition. This ensures that you can compose two styled elements together and the
  styles will be merged correctly.

```jsx
const Box = styled('div', {
  base: {
    background: 'red.light',
    color: 'white',
  },
})

const ExtendedBox = styled(Box, {
  base: { background: 'red.dark' },
})

// <ExtendedBox> will have a background of `red.dark` and a color of `white`
```

**Limitation:** This feature does not allow compose mixed styled composition. A mixed styled composition happens when an
element is created from a cva/inline cva, and another created from a config recipe.

- CVA or Inline CVA + CVA or Inline CVA = ✅
- Config Recipe + Config Recipe = ✅
- CVA or Inline CVA + Config Recipe = ❌

```jsx
import { button } from '../styled-system/recipes'

const Button = styled('div', button)

// ❌ This will throw an error
const ExtendedButton = styled(Button, {
  base: { background: 'red.dark' },
})
```

- Export all types from @pandacss/types, which will also export all types exposed in the outdir/types. Also make the
  `config.prefix` object Partial so that each key is optional.
- Apply `config.logLevel` from the Panda config to the logger in every context. Fixes
  https://github.com/chakra-ui/panda/issues/1451
- Automatically add each recipe slots to the `jsx` property, with a dot notation

```ts
const button = defineSlotRecipe({
  className: 'button',
  slots: ['root', 'icon', 'label'],
  // ...
})
```

will have a default `jsx` property of: `[Button, Button.Root, Button.Icon, Button.Label]`

- Added a new type to extract variants out of styled components

```tsx
import { StyledVariantProps } from '../styled-system/jsx'

const Button = styled('button', {
  base: { color: 'black' },
  variants: {
    state: {
      error: { color: 'red' },
      success: { color: 'green' },
    },
  },
})

type ButtonVariantProps = StyledVariantProps<typeof Button>
//   ^ { state?: 'error' | 'success' | undefined }
```

## [0.16.0] - 2023-10-15

### Fixed

- Correct typings for Qwik components

### Added

- Apply a few optmizations on the resulting CSS generated from `panda cssgen` command
- Add closed condition `&:is([closed], [data-closed], [data-state="closed"])`
- Adds a new `--minimal` flag for the CLI on the `panda cssgen` command to skip generating CSS for theme tokens,
  preflight, keyframes, static and global css

Thich means that the generated CSS will only contain the CSS related to the styles found in the included files.

> Note that you can use a `glob` to override the `config.include` option like this:
> `panda cssgen "src/**/*.css" --minimal`

This is useful when you want to split your CSS into multiple files, for example if you want to split by pages.

Use it like this:

```bash
panda cssgen "src/**/pages/*.css" --minimal --outfile dist/pages.css
```

In addition to the optional `glob` that you can already pass to override the config.include option, the `panda cssgen`
command now accepts a new `{type}` argument to generate only a specific type of CSS:

- preflight
- tokens
- static
- global
- keyframes

> Note that this only works when passing an `--outfile`.

You can use it like this:

```bash
panda cssgen "static" --outfile dist/static.css
```

## [0.15.5] - 2023-10-4

### Fixed

- Fix issue where unused recipes and slot recipes doesn't get treeshaken properly
- Fix issue with `Promise.all` where it aborts premature ine weird events. Switched to `Promise.allSettled`.
- **Vue**: Fix issue where elements created from styled factory does not forward DOM attributes and events to the
  underlying element.
- **Vue**: Fix regression in generated types
- **Preact**: Fix regression in generated types

## [0.15.4] - 2023-09-29

### Fixed

- Fix preset merging, config wins over presets.
- Fix issues with class merging in the `styled` factory fn for Qwik, Solid and Vue.
- Fix static extraction of the [Array Syntax](https://panda-css.com/docs/concepts/responsive-design#the-array-syntax)
  when used with runtime conditions

Given a component like this:

```ts
function App() {
  return <Box py={[2, verticallyCondensed ? 2 : 3, 4]} />
}
```

the `py` value was incorrectly extracted like this:

```ts
 {
    "py": {
        "1": 2,
    },
},
{
    "py": {
        "1": 3,
    },
},
```

which would then generate invalid CSS like:

```css
.paddingBlock\\\\:1_2 {
  1: 2px;
}

.paddingBlock\\\\:1_3 {
  1: 3px;
}
```

it's now correctly transformed back to an array:

```diff
{
  "py": {
-    "1": 2,
+   [
+       undefined,
+       2,
+   ]
  },
},
{
  "py": {
-    "1": 3,
+   [
+       undefined,
+       3,
+   ]
  },
},
```

which will generate the correct CSS

```css
@media screen and (min-width: 40em) {
  .sm\\\\:py_2 {
    padding-block: var(--spacing-2);
  }

  .sm\\\\:py_3 {
    padding-block: var(--spacing-3);
  }
}
```

### Added

Improved styled factory by adding a 3rd (optional) argument:

```ts
interface FactoryOptions<TProps extends Dict> {
  dataAttr?: boolean
  defaultProps?: TProps
  shouldForwardProp?(prop: string, variantKeys: string[]): boolean
}
```

- Setting `dataAttr` to true will add a `data-recipe="{recipeName}"` attribute to the element with the recipe name. This
  is useful for testing and debugging.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button, { dataAttr: true })

const App = () => (
  <Button variant="secondary" mt="10px">
    Button
  </Button>
)
// Will render something like <button data-recipe="button" class="btn btn--variant_purple mt_10px">Button</button>
```

- `defaultProps` allows you to skip writing wrapper components just to set a few props. It also allows you to locally
  override the default variants or base styles of a recipe.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button, {
  defaultProps: {
    variant: 'secondary',
    px: '10px',
  },
})

const App = () => <Button>Button</Button>
// Will render something like <button class="btn btn--variant_secondary px_10px">Button</button>
```

- `shouldForwardProp` allows you to customize which props are forwarded to the underlying element. By default, all props
  except recipe variants and style props are forwarded.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { isCssProperty } from '../styled-system/jsx'
import { motion, isValidMotionProp } from 'framer-motion'

const StyledMotion = styled(
  motion.div,
  {},
  {
    shouldForwardProp: (prop, variantKeys) =>
      isValidMotionProp(prop) || (!variantKeys.includes(prop) && !isCssProperty(prop)),
  },
)
```

## [0.15.3] - 2023-09-27

### Fixed

- Fix issue where HMR does not work for Vue JSX factory and patterns
- Fix issue in template literal mode where media queries doesn't work
- Fix `ExtendableUtilityConfig` typings after a regression in 0.15.2 (due to
  https://github.com/chakra-ui/panda/pull/1410)
- Fix `ExtendableTheme` (specifically make the `RecipeConfig` Partial inside the `theme: { extend: { ... } }` object),
  same for slotRecipes

### Added

- Add a new `config.importMap` option that allows you to specify a custom module specifier to import from instead of
  being tied to the `outdir`

You can now do things like leverage the native package.json
[`imports`](https://nodejs.org/api/packages.html#subpath-imports):

```ts
export default defineConfig({
  outdir: './outdir',
  importMap: {
    css: '#panda/styled-system/css',
    recipes: '#panda/styled-system/recipes',
    patterns: '#panda/styled-system/patterns',
    jsx: '#panda/styled-system/jsx',
  },
})
```

Or you could also make your outdir an actual package from your monorepo:

```ts
export default defineConfig({
  outdir: '../packages/styled-system',
  importMap: {
    css: '@monorepo/styled-system',
    recipes: '@monorepo/styled-system',
    patterns: '@monorepo/styled-system',
    jsx: '@monorepo/styled-system',
  },
})
```

Working with tsconfig paths aliases is easy:

```ts
export default defineConfig({
  outdir: 'styled-system',
  importMap: {
    css: 'styled-system/css',
    recipes: 'styled-system/recipes',
    patterns: 'styled-system/patterns',
    jsx: 'styled-system/jsx',
  },
})
```

### Changed

Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory, example below

With this config recipe:

```ts file="panda.config.ts"
const button = defineRecipe({
  className: 'btn',
  base: { color: 'green', fontSize: '16px' },
  variants: {
    size: { small: { fontSize: '14px' } },
  },
  compoundVariants: [{ size: 'small', css: { color: 'blue' } }],
})
```

This would previously not merge the `color` property overrides, but now it does:

```tsx file="example.tsx"
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button)

function App() {
  return (
    <>
      <Button size="small" color="red.100">
        Click me
      </Button>
    </>
  )
}
```

- Before: `btn btn--size_small text_blue text_red.100`
- After: `btn btn--size_small text_red.100`

## [0.15.2] - 2023-09-26

### Fixed

- Fix issue where studio uses studio config, instead of custom panda config.

### Added

- Update supported panda config extensions
- Create custom partial types for each config object property

When bundling the `outdir` in a library, you usually want to generate type declaration files (`d.ts`). Sometimes TS will
complain about types not being exported.

- Export all types from `{outdir}/types/index.d.ts`, this fixes errors looking like this:

```
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/system-types'. This is likely not portable. A type annotation is necessary.
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/csstype'. This is likely not portable. A type annotation is necessary.
src/components/Checkbox/index.tsx(8,7): error TS2742: The inferred type of 'Root' cannot be named without a reference to '../../../node_modules/@acmeorg/styled-system/types/conditions'. This is likely not portable. A type annotation is necessary.
```

- Export generated recipe interfaces from `{outdir}/recipes/{recipeFn}.d.ts`, this fixes errors looking like this:

```
src/ui/avatar.tsx (16:318) "AvatarRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/avatar.tsx".
src/ui/card.tsx (2:164) "CardRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/card.tsx".
src/ui/checkbox.tsx (19:310) "CheckboxRecipe" is not exported by "styled-system/recipes/index.d.ts", imported by "src/ui/checkbox.tsx".
```

- Export type `ComponentProps` from `{outdir}/types/jsx.d.ts`, this fixes errors looking like this:

```
 "ComponentProps" is not exported by "styled-system/types/jsx.d.ts", imported by "src/ui/form-control.tsx".
```

### Changed

- Switch to interface for runtime types
- BREAKING CHANGE: Presets merging order felt wrong (left overriding right presets) and is now more intuitive (right
  overriding left presets)

> Note: This is only relevant for users using more than 1 custom defined preset that overlap with each other.

Example:

```ts
const firstConfig = definePreset({
  theme: {
    tokens: {
      colors: {
        'first-main': { value: 'override' },
      },
    },
    extend: {
      tokens: {
        colors: {
          orange: { value: 'orange' },
          gray: { value: 'from-first-config' },
        },
      },
    },
  },
})

const secondConfig = definePreset({
  theme: {
    tokens: {
      colors: {
        pink: { value: 'pink' },
      },
    },
    extend: {
      tokens: {
        colors: {
          blue: { value: 'blue' },
          gray: { value: 'gray' },
        },
      },
    },
  },
})

// Final config
export default defineConfig({
  presets: [firstConfig, secondConfig],
})
```

Here's the difference between the old and new behavior:

```diff
{
  "theme": {
    "tokens": {
      "colors": {
        "blue": {
          "value": "blue"
        },
-        "first-main": {
-          "value": "override"
-        },
        "gray": {
-          "value": "from-first-config"
+          "value": "gray"
        },
        "orange": {
          "value": "orange"
        },
+        "pink": {
+            "value": "pink",
+        },
      }
    }
  }
}
```

## [0.15.1] - 2023-09-19

### Fixed

- Fix an issue when wrapping a component with `styled` would display its name as `styled.[object Object]`
- Fix issue in css reset where number input field spinner still show.
- Fix issue where slot recipe breaks when `slots` is `undefined`

### Added

- Reuse css variable in semantic token alias
- Add the property `-moz-osx-font-smoothing: grayscale;` to the `reset.css` under the `html` selector.
- Allow referencing tokens with the `token()` function in media queries or any other CSS at-rule.

```js
import { css } from '../styled-system/css'

const className = css({
  '@media screen and (min-width: token(sizes.4xl))': {
    color: 'green.400',
  },
})
```

- Extract {fn}.raw as an identity fn

so this will now work:

```ts
import { css } from 'styled-system/css'

const paragraphSpacingStyle = css.raw({
  '&:not(:first-child)': { marginBlockEnd: '1em' },
})

export const proseCss = css.raw({
  maxWidth: '800px',
  '& p': {
    '&:not(:first-child)': { marginBlockStart: '1em' },
  },
  '& h1': paragraphSpacingStyle,
  '& h2': paragraphSpacingStyle,
})
```

- Use ECMA preset for ts-evaluator: This means that no other globals than those that are defined in the ECMAScript spec
  such as Math, Promise, Object, etc, are available but it allows for some basic evaluation of expressions like this:

```ts
import { cva } from '.panda/css'

const variants = () => {
  const spacingTokens = Object.entries({
    s: 'token(spacing.1)',
    m: 'token(spacing.2)',
    l: 'token(spacing.3)',
  })

  const spacingProps = {
    px: 'paddingX',
    py: 'paddingY',
  }

  // Generate variants programmatically
  return Object.entries(spacingProps)
    .map(([name, styleProp]) => {
      const variants = spacingTokens
        .map(([variant, token]) => ({ [variant]: { [styleProp]: token } }))
        .reduce((_agg, kv) => ({ ..._agg, ...kv }))

      return { [name]: variants }
    })
    .reduce((_agg, kv) => ({ ..._agg, ...kv }))
}

const baseStyle = cva({
  variants: variants(),
})
```

## [0.15.0] - 2023-09-13

### Fixed

- Fix issue (https://github.com/chakra-ui/panda/issues/1365) with the `unbox` fn that removed nullish values, which
  could be useful for the [Array Syntax](https://panda-css.com/docs/concepts/responsive-design#the-array-syntax)

```ts
const className = css({
  color: ['black', undefined, 'orange', 'red'],
})
```

- Fix issue where slot recipe did not apply rules when variant name has the same key as a slot
- Fix issue with cva when using compoundVariants and not passing any variants in the usage (ex: `button()` with
  `const button = cva({ ... })`)
- Fix issue where hideFrom doesn't work due to incorrect breakpoint computation
- Fix issue where the `satisfies` would prevent an object from being extracted
- Fix an issue where some JSX components wouldn't get matched to their corresponding recipes/patterns when using `Regex`
  in the `jsx` field of a config, resulting in some style props missing.

### Added

- Allow `string`s as `zIndex` and `opacity` tokens in order to support css custom properties

### Changed

- Refactor: Prefer `NativeElements` type for vue jsx elements
- Move slot recipes styles to new `recipes.slots` layer so that classic config recipes will have a higher specificity
- Make the types suggestion faster (updated `DeepPartial`)

## [0.14.0] - 2023-09-05

### Fixed

- Fix issue where `pattern.raw(...)` did not share the same signature as `pattern(...)`
- Fix issue where negative spacing tokens doesn't respect hash option
- Fix `config.strictTokens: true` issue where some properties would still allow arbitrary values
- Fix issue with the `token()` function in CSS strings that produced CSS syntax error when non-existing token were left
  unchanged (due to the `.`)

**Before:**

```css
* {
  color: token(colors.magenta, pink);
}
```

**Now**:

```css
* {
  color: token('colors.magenta', pink);
}
```

### Added

- Add `{svaFn}.raw` function to get raw styles and allow reusable components with style overrides, just like with
  `{cvaFn}.raw`
- The utility transform fn now allow retrieving the token object with the raw value/conditions as currently there's no
  way to get it from there.
- Add `generator:done` hook to perform actions when codegen artifacts are emitted.
- Add each condition raw value information on hover using JSDoc annotation
- Add missing types (PatternConfig, RecipeConfig, RecipeVariantRecord) to solve a TypeScript issue (The inferred type of
  xxx cannot be named without a reference...)
- Add missing types (`StyledComponents`, `RecipeConfig`, `PatternConfig` etc) to solve a TypeScript issue (The inferred
  type of xxx cannot be named without a reference...) when generating declaration files in addition to using
  `emitPackage: true`
- Introduces deep nested `colorPalettes` for enhanced color management
- Previous color palette structure was flat and less flexible, now `colorPalettes` can be organized hierarchically for
  improved organization

**Example**: Define colors within categories, variants and states

```js
const theme = {
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
          background: 'colorPalette.light.accent.secondary',
        },
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
        color: 'colorPalette.secondary',
      })}
    >
      Nested color palette leaf
    </button>
  )
}
```

### Changed

- Change the typings for the `css(...args)` function so that you can pass possibly undefined values to it. This is
  mostly intended for component props that have optional values like `cssProps?: SystemStyleObject` and would use it
  like `css({ ... }, cssProps)`
- Change the `css.raw` function signature to match the one from [`css()`](https://github.com/chakra-ui/panda/pull/1264),
  to allow passing multiple style objects that will be smartly merged.

## [0.13.1] - 2023-08-29

### Fixed

- Fix issue where Panda does not detect styles after nested template in vue
- Fix issue where `cva` is undefined in preact styled factory

### Added

- Allow `.mts` and `.cts` panda config extension
- Add `forceConsistentTypeExtension` config option for enforcing consistent file extension for emitted type definition
  files. This is useful for projects that use `moduleResolution: node16` which requires explicit file extensions in
  imports/exports.
  > If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension
  > `.d.mts`.

## [0.13.0] - 2023-08-26

### Fixed

- Fix issue where `panda --minify` does not work.
- Fix issue where `defineTextStyle` and `defineLayerStyle` return types are incompatible with `config.theme` type.
- Fix an issue with custom JSX components not finding their matching patterns.

### Added

- Add support for minification in `cssgen` command.

## [0.12.2] - 2023-08-25

### Fixed

- Fix bug in generated js code for atomic slot recipe where `splitVariantProps` didn't work without the first slot key.

### Changed

- Change the `css` function signature to allow passing multiple style objects that will be smartly merged, and revert
  the `cx` method to string concatenation behaviour.

```diff
import { css, cx } from '../styled-system/css'

const App = () => {
  return (
    <>
-      <div className={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>
+      <div className={css({ mx: '3', paddingTop: '4' }, { mx: '10', pt: '6' })}>
        Will result in `class="mx_10 pt_6"`
      </div>
    </>
  )
}
```

- To design a component that supports style overrides, you can now provide the `css` prop as a style object, and it'll
  be merged correctly.

```tsx filename="src/components/Button.tsx"
import { css } from '../styled-system/css'

export const Button = ({ css: cssProp = {}, children }) => {
  const className = css({ display: 'flex', alignItem: 'center', color: 'black' }, cssProp)
  return <button className={className}>{children}</button>
}
```

Then you can use the `Button` component like this:

```tsx filename="src/app/page.tsx"
import { Button, Thingy } from './Button'

export default function Page() {
  return (
    <Button css={{ color: 'pink', _hover: { color: 'red' } }}>
      will result in `class="d_flex items_center text_pink hover:text_red"`
    </Button>
  )
}
```

- Rename the `{cvaFn}.resolve` function to `{cva}.raw` for API consistency.
- Change the behaviour of `{patternFn}.raw` to return the resulting `SystemStyleObject` instead of the arguments passed
  in. This is to allow the `css` function to merge the styles correctly.

The new `{cvaFn}.raw` and `{patternFn}.raw` functions, will allow style objects to be merged as expected in any
situation.

**Pattern Example:**

```tsx filename="src/components/Button.tsx"
import { hstack } from '../styled-system/patterns'
import { css, cva } from '../styled-system/css'

export const Button = ({ css: cssProp = {}, children }) => {
  // using the flex pattern
  const hstackProps = hstack.raw({
    border: '1px solid',
    _hover: { color: 'blue.400' },
  })

  // merging the styles
  const className = css(hstackProps, cssProp)

  return <button className={className}>{children}</button>
}
```

**CVA Example:**

```tsx filename="src/components/Button.tsx"
import { css, cva } from '../styled-system/css'

const buttonRecipe = cva({
  base: { display: 'flex', fontSize: 'lg' },
  variants: {
    variant: {
      primary: { color: 'white', backgroundColor: 'blue.500' },
    },
  },
})

export const Button = ({ css: cssProp = {}, children }) => {
  const className = css(
    // using the button recipe
    buttonRecipe.raw({ variant: 'primary' }),

    // adding style overrides (internal)
    { _hover: { color: 'blue.400' } },

    // adding style overrides (external)
    cssProp,
  )

  return <button className={className}>{props.children}</button>
}
```

## [0.12.1] - 2023-08-24

### Fixed

- Fix issue where `AnimationName` type was generated wrongly if no keyframes were resolved in the config.

## [0.12.0] - 2023-08-24

### Fixed

- Fix issue where styled factory does not respect union prop types like `type Props = AProps | BProps`
- Fix failed styled component for solid-js when using recipe

### Added

- Add interactive flag to `panda init` command. This flag allows you to run the init command in interactive mode.

```sh
panda init -i
```

![panda init interactive mode](https://github.com/chakra-ui/panda/assets/30869823/0ae28a54-bfce-44dc-a314-c0f795c1da3b)

- Add `defineUtility` method. This method allows you to define custom utilities in your config.

```ts
import { defineUtility, defineConfig } from '@pandacss/dev'

const appearance = defineUtility({
  className: 'appearance',
  transform(value) {
    return { appearance: value, WebkitAppearance: value }
  },
})

export default defineConfig({
  utilities: {
    appearance,
  },
})
```

- Add `animationName` utility. This utility connects to your keyframes.

## [0.11.1] - 2023-08-16

### Fixed

Add missing svg props types.

### Added

Add new `layers` key to config, to make layers customizable.

Example:

**In Config**:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  layers: {
    utilities: 'panda_utilities',
  },
})
```

**In global css**:

```diff
- @layer reset, base, tokens, recipes, utilities;
+ @layer reset, base, tokens, recipes, panda_utilities;
```

Doing this:

```tsx
import { css } from '../styled-system/css'

const App = () => {
  return <div className={css({ color: 'blue.500' })} />
}
```

Results in:

```css
@layer panda_utilities {
  .text_blue\.500 {
    color: var(--colors-blue-500);
  }
}
```

### Changed

Make the `cx` smarter by merging and deduplicating the styles passed in.

Example:

```tsx
import { css, cx } from '../styled-system/css'

export function Page() {
  return (
    <div class={cx(css({ mx: '3', paddingTop: '4' }), css({ mx: '10', pt: '6' }))}>Will result in "mx_10 pt_6"</div>
  )
}
```

## [0.11.0] - 2023-08-11

### Fixed

- Fix regression where style property with multiple shorthand did not generate the correct className
- Normalize tsconfig path mapping to ensure consistency across platforms
- Fix issue where some style properties shows TS error when using `!important`

### Added

- Add new visually hidden and bleed patterns.

  **Bleed** is a layout pattern is used to negate the padding applied to a parent container. You can apply an `inline`
  or `block` bleed to a child element, setting its value to match the parent's padding.

  ```tsx
  import { css } from '../styled-system/css'
  import { bleed } from '../styled-system/patterns'

  export function Page() {
    return (
      <div class={css({ px: '6' })}>
        <div class={bleed({ inline: '6' })}>Welcome</div>
      </div>
    )
  }
  ```

  **Visually hidden** is a layout pattern used to hide content visually, but still make it available to screen readers.

  ```tsx
  import { css } from '../styled-system/css'
  import { visuallyHidden } from '../styled-system/patterns'

  export function Checkbox() {
    return (
      <label>
        <input type="checkbox" class={visuallyHidden()}>
          I'm hidden
        </input>
        <span>Checkbox</span>
      </label>
    )
  }
  ```

- Add support for optional `glob` argument in the `panda cssgen` command. It is useful when you need to extract the css
  of specific pages in your application.

  > This argument overrides the `include` config option.

  ```sh
  panda cssgen app/ecommerce/**/*.tsx -o ecommerce.css
  ```

- Added a new hook for when the final `styles.css` content has been generated. This is useful when you need to do
  something with the final CSS content.

  ```ts filename=panda.config.ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    hooks: {
      'generator:css'(file, content) {
        if (file === 'styles.css') {
          // do something with the final css content
        }
      },
    },
  })
  ```

### Changed

- Removed the `@pandacss/dev/astro` entrypoint in favor of installing `@pandacss/astro` package
- Automatically inject the entry css `@layer` in `@pandacss/astro` removing the need to manually setup a css file.

## [0.10.0] - 2023-08-07

### Fixed

- Reduce the size of the generated JS code by ~30% by optimizing the generated code.
  > Check [this PR](https://github.com/chakra-ui/panda/pull/1115) to see the details.
- Fix issue in `staticCss` where recipe css generation does not work when recipe includes only `base` (no `variants`)
- Fix issue where `opacity` property is not connected to the `opacity` tokens

### Added

#### Slot Recipes

Introduce new slot recipe features to define recipes that can be used to style composite or multi-part components
easily.

- `sva`: the slot recipe version of `cva`
- `defineSlotRecipe`: the slot recipe version of `defineRecipe`

**Atomic Slot Recipe**

Use the `sva` function to define atomic slot recipes.

```jsx
import { sva } from 'styled-system/css'

const button = sva({
  slots: ['label', 'icon'],
  base: {
    label: { color: 'red', textDecoration: 'underline' },
  },
  variants: {
    rounded: {
      true: {},
    },
    size: {
      sm: {
        label: { fontSize: 'sm' },
        icon: { fontSize: 'sm' },
      },
      lg: {
        label: { fontSize: 'lg' },
        icon: { fontSize: 'lg', color: 'pink' },
      },
    },
  },
  defaultVariants: {
    size: 'sm',
  },
})

export function App() {
  const btnClass = button({ size: 'lg', rounded: true })

  return (
    <button>
      <p class={btnClass.label}> Label</p>
      <p class={btnClass.icon}> Icon</p>
    </button>
  )
}
```

**Config Slot Recipe**

Use the `defineSlotRecipe` function to define slot recipes in your config.

```ts filename=panda.config.ts
import { defineConfig, defineSlotRecipe } from '@pandacss/dev'

export default defineConfig({
  theme: {
    slotRecipes: {
      button: defineSlotRecipe({
        className: 'button',
        slots: ['label', 'icon'],
        base: {
          label: { color: 'red', textDecoration: 'underline' },
        },
        variants: {
          rounded: {
            true: {},
          },
          size: {
            sm: {
              label: { fontSize: 'sm' },
              icon: { fontSize: 'sm' },
            },
            lg: {
              label: { fontSize: 'lg' },
              icon: { fontSize: 'lg', color: 'pink' },
            },
          },
        },
        defaultVariants: {
          size: 'sm',
        },
      }),
    },
  },
})
```

Here's how you can use the config slot recipe in your JSX code. The classnames generated by the slot recipe are added to
the `recipes` cascade layer.

```jsx
import { button } from 'styled-system/recipes'

export function App() {
  const btnClass = button({ size: 'lg', rounded: true })

  return (
    <button>
      <p class={btnClass.label}> Label</p>
      <p class={btnClass.icon}> Icon</p>
    </button>
  )
}
```

#### JSX Style Props

Add `jsxStyleProps` config option for controlling how JSX style props are handled in Panda. It helps to significantly
reducing the bundle size of the generated JS code by using the `jsxStyleProps` config option.

This config option supports 3 values:

- `all`: All CSS properties can be used as JSX style props. This is the default value.

```ts filename=panda.config.ts
export default defineConfig({
  jsxStyleProps: 'all',
})
```

```jsx
import { styled } from 'styled-system/jsx'

const Example = () => {
  // all CSS properties + css prop are allowed
  return <Box bg="red.400" color="white" css={{...}} />
}
```

- `minimal`: Only the `css` prop can be used as JSX style props. This reduced the generated JS bundle size by ~45%.

```ts filename=panda.config.ts
export default defineConfig({
  jsxStyleProps: 'minimal',
})
```

```jsx
import { styled } from 'styled-system/jsx'

const Example = () => {
  // only the `css` prop is allowed
  return <Box css={{ bg: 'red.400', color: 'white' }} />
}
```

- `none`: No CSS properties can be used as JSX style props. This reduced the generated JS bundle size by ~48%.

```ts filename=panda.config.ts
export default defineConfig({
  jsxStyleProps: 'none',
})
```

> Check [this PR](https://github.com/chakra-ui/panda/pull/1115) to see the details.

### Changed

Update Panda preset conditions:

- `_checked` now supports `[data-state=checked]`
- `_expanded` now supports `[data-state=expanded]`
- `_indeterminate` now supports `[data-state=indeterminate]`
- `_open` now supports `[data-open]` and `[data-state=open]`

## [0.9.0] - 2023-07-28

### Fixed

- Fix issue where extractor did not consider `true` and `false` branch when using tenary operator
- Fix issue where postcss plugin did not respect the `cwd` option in the panda config
- Fix issue where `asset` tokens generated invalid css variable

### Added

Update the `jsx` property to be used for advanced tracking of custom pattern components.

```jsx
import { Circle } from 'styled-system/jsx'

const CustomCircle = ({ children, ...props }) => {
  return <Circle {...props}>{children}</Circle>
}
```

To track the `CustomCircle` component, you can now use the `jsx` property.

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  patterns: {
    extend: {
      circle: {
        jsx: ['CustomCircle'],
      },
    },
  },
})
```

### Changed

- **BREAKING:** Renamed the `name` property of a config recipe to `className`. This is to ensure API consistency and
  express the intent of the property more clearly.

```diff
export const buttonRecipe = defineRecipe({
-  name: 'button',
+  className: 'button',
  // ...
})
```

> Update your config to use the new `className` property and run `panda codegen --clean` to update the generated code.

- **BREAKING:** Renamed the `jsx` property of a pattern to `jsxName`.

```diff
const hstack = definePattern({
-  jsx: 'HStack',
+  jsxName: 'HStack',
  // ...
})
```

> Update your config to use the new `jsxName` property and run `panda codegen --clean` to update the generated code.

## [0.8.0] - 2023-07-25

### Fixed

- Fix issue where `panda init` with `jsxFramework` flag generated invalid object due to missing comma.
- Fix issue where composite tokens in semantic tokens generated invalid css.
- Fix issue where extractor doesn't work reliably due to `typescript` module version mismatch.
- Fix issue where generated package json does not respect `outExtension` when `emitPackage` is `true`

### Added

- Added new flags to the `panda cssgen` and `panda ship` command:

  - `-w, --watch` flag to watch for changes
  - `-o` shortcut for `--outfile`

- Introduce the new `{fn}.raw()` method to css, patterns and recipes. This function is an identity function and only
  serves as a hint for the extractor to extract the css.

  It can be useful, for example, in Storybook args or custom react props.

```tsx
// mark the object as valid css for the extractor
<Button rootProps={css.raw({ bg: 'red.400' })} />
```

```tsx
export const Funky: Story = {
  // mark this as a button recipe usage
  args: button.raw({
    visual: 'funky',
    shape: 'circle',
    size: 'sm',
  }),
}
```

### Changed

- Improve virtual color processing to avoid generated unused css variables.
- Improve generated react jsx types to remove legacy ref
- Temporarily disable VSCode extension in `.svelte` or `.vue` files

## [0.7.0] - 2023-07-17

### Fixed

- Fix postcss issue where `@layer reset, base, tokens, recipes, utilities` check was too strict
- Fix parser issue in `.vue` files, make the traversal check nested elements instead of only checking the 1st level
- Fix issue where slash could not be used in token name
- Improve module detection and hot module reloading in the PostCSS plugin when external files are changed
- Fix issue where `splitVariantProps` in cva doesn't resolve the correct types
- Fix issue where `zIndex` tokens are not connected to zIndex utility

### Changed

- Refactor `transition` utility to improve DX of adding transition. Transitions will now add a default transition
  property, timing function and duration. This allows you to add transitions with a single property.

```jsx
<div className={css({ transition: 'background' })}>Content</div>
```

This will generate the following css:

```css
.transition_background {
  transition-property: background, background-color;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

## [0.6.0] - 2023-07-08

### Fixed

- Fix type issue with the `definePattern` function
- Fix issue where `panda cssgen --outfile` doesn't extract files to chunks before bundling them into the css out file
- Fix issue where `gridRows` has the wrong `className`
- Fix issue where `gridItem` pattern did not use the `colStart` and `rowStart` values
- Fix issue where unitless grid properties were converted to pixel values
- Fix issue where `_even` and `_odd` map to incorrect selectors
- Fix issue where `--config` flag doesn't work for most commands.
- Fix issue where `css` prop was not extracted correctly in JSX elements

### Added

- Add negative fraction values to `translateX` and `translateY` utilities
- Export `isCssProperty` helper function from `styled-system/jsx` entrypoint
- Add support for using multiple config rcipes in the same component

### Changed

## [0.5.1] - 2023-07-02

### Fixed

- Fix issue where `panda studio` command doesn't work outside of panda's monorepo.

- Fix parser issue where operation tokens like `1/2` was not detected.

- Improved Svelte file parsing algorithm to support more edge cases.

- Improved config dependency and imported file detection.

### Added

- Add support for `--outfile` flag in the `cssgen` command.

```bash
panda cssgen --outfile dist/styles.css
```

- Add feature where `config.staticCss.recipes` can now use [`*`] to generate all variants of a recipe.

```ts
staticCss: {
  recipes: {
    button: ['*']
  }
}
```

### Changed

- Refactored all conditions to use `:is` selector to improve specificity and reduce the reliance on css order.

## [0.5.0] - 2023-06-26

### Fixed

- Fix issue where escaping classname doesn't work when class starts with number.

### Added

- Add support for tagged template literal version.

  This features is pure css approach to writing styles, and can be a great way to migrate from styled-components and
  emotion.

  Set the `syntax` option to `template-literal` in the panda config to enable this feature.

  ```js
  // panda.config.ts
  export default defineConfig({
    //...
    syntax: 'template-literal',
  })
  ```

  > For existing projects, you might need to run the `panda codegen --clean`

  You can also use the `--syntax` option to specify the syntax type when using the CLI.

  ```sh
  panda init -p --syntax template-literal
  ```

To get autocomplete for token variables, consider using the
[CSS Var Autocomplete](https://marketplace.visualstudio.com/items?itemName=phoenisx.cssvar) extension.

### Changed

- Update the default color palette to match Tailwind's new palette.

## [0.4.0] - 2023-06-19

### Fixed

- Fix issue here divider pattern generated incorrect css in horizontal orientation
- Fix issue where aspect ratio css property adds `px`
- Fix placeholder condition to map to `&::placeholder`
- Fix issue where patterns that include css selectors doesn't work in JSX
- Fix issue where the `panda ship` command does not write to the correct path

### Added

- Experimental support for native `.vue` files and `.svelte` files
- Add types for supported at-rules (`@media`, `@layer`, `@container`, `@supports`, and `@page`)
- Add webkit polyfill for common properties to reduce the need for `autoprefixer`
- Add support for watch mode in codegen command via the `--watch` or `-w` flag.

  ```sh
  panda codegen --watch
  ```

- Add support for disabling shorthand props

  ```ts
  import { defineConfig } from '@pandacss/dev'

  export default defineConfig({
    // ...
    shorthands: false,
  })
  ```

### Changed

- Add `auto` value where neccessary to base utilities.
- Add `0` value to default spacing tokens to allow for `strictTokens` mode.

## [0.3.2] - 2023-06-16

### Added

- Add support for config path in cli commands via the `--config` or `-c` flag.

  ```bash
  panda init --config ./pandacss.config.js
  ```

- Add support for setting config path in postcss

  ```js
  module.exports = {
    plugins: [
      require('@pandacss/postcss')({
        configPath: './path/to/panda.config.js',
      }),
    ],
  }
  ```

### Changed

- Remove `bundledDependencies` from `package.json` to fix NPM resolution

## [0.3.1] - 2023-06-16

Baseline Release 🎉
