---
title: Configuring Panda
description: Customize how Panda works via the `panda.config.ts` file in your project.
---

# Config Reference

Customize how Panda works via the `panda.config.ts` file in your project.

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // your configuration options here...
})
```

## Output css options

### presets

**Type**: `string[]`

**Default**: `[]`

The set of reusable and shareable configuration presets.

By default, any preset you add will be smartly merged with the default configuration, with your own configuration acting
as a set of overrides and extensions.

```json
{
  "presets": ["@pandacss/preset-base", "@pandacss/preset-panda"]
}
```

### preflight

**Type**: `boolean` | `{ scope: string; }`

**Default**: `false`

Whether to enable css reset styles.

Enable preflight:

```json
{
  "preflight": true
}
```

You can also scope the preflight; Especially useful for being able to scope the CSS reset to only a part of the app for some reason.

Enable preflight and customize the scope:

```json
{
  "preflight": { "scope": ".extension" }
}
```

The resulting `reset` css would look like this:

```css
.extension button,
.extension select {
  text-transform: none;
}

.extension table {
  text-indent: 0;
  border-color: inherit;
  border-collapse: collapse;
}
```

You can also set the level to `element` (defaults to `parent`) to only reset the elements that have the scope class assigned.

```json
{
  "preflight": { "scope": ".extension", "level": "element" }
}
```

The resulting `reset` css would look like this:

```css
button.extension,
select.extension {
  text-transform: none;
}

table.extension {
  text-indent: 0;
  border-color: inherit;
  border-collapse: collapse;
}
```

### emitTokensOnly

**Type**: `boolean`

**Default**: `false`

Whether to only emit the `tokens` directory

```json
{
  "emitTokensOnly": false
}
```

### prefix

**Type**: `string`

The namespace prefix for the generated css classes and css variables.

Ex: when using a prefix of `panda-`

```json
{
  "prefix": "panda"
}
```

```tsx
import { css } from '../styled-system/css'

const App = () => {
  return <div className={css({ color: 'blue.500' })} />
}
```

would result in:

```css
.panda-text_blue\.500 {
  color: var(--panda-colors-blue-500);
}
```

### layers

**Type**: `Partial<Layer>`

Cascade layers used in generated css.

Ex: when customizing the utilities layer

```json
{
  "layers": {
    "utilities": "panda_utilities"
  }
}
```

```tsx
import { css } from '../styled-system/css'

const App = () => {
  return <div className={css({ color: 'blue.500' })} />
}
```

would result in:

```css
@layer panda_utilities {
  .text_blue\.500 {
    color: var(--colors-blue-500);
  }
}
```

You should update the layer in your root css also.

### separator

**Type**: `'_' | '=' | '-'`

**Default**: `'_'`

The separator for the generated css classes.

```json
{
  "separator": "_"
}
```

Using a `=` with:

```tsx
import { css } from '../styled-system/css'

const App = () => {
  return <div className={css({ color: 'blue.500' })} />
}
```

would result in:

```css
.text\=blue\.500 {
  color: var(--colors-blue-500);
}
```

### minify

**Type**: `boolean`

**Default**: `false`

Whether to minify the generated css. This can be set to `true` to reduce the size of the generated css.

```json
{
  "minify": false
}
```

### hash

**Type**: `boolean | { cssVar: boolean; className: boolean }`

**Default**: `false`

Whether to hash the generated class names / css variables. This is useful if want to shorten the class names or css variables.

Hash the class names and css variables:

```json
{
  "hash": true
}
```

This

```tsx
import { css } from '../styled-system/css'

const App = () => {
  return <div className={css({ color: 'blue.500' })} />
}
```

would result in something that looks like:

```css
.dOFUTE {
  color: var(--cgpxvS);
}
```

You can also hash them individually.

E.g. only hash the css variables:

```json
{
  "hash": { "cssVar": true, "className": false }
}
```

Then the result looks like this:

```css
.text_blue\.500 {
  color: var(--cgpxvS);
}
```

Now only hash the class names:

```json
{
  "hash": { "cssVar": false, "className": true }
}
```

Then the result looks like this:

```css
.dOFUTE {
  color: var(--colors-blue-500);
}
```

## File system options

### gitignore

**Type**: `boolean`

**Default**: `true`

Whether to update the .gitignore file.

```json
{
  "gitignore": true
}
```

Will add the following to your `.gitignore` file:

```.gitignore
# Panda
styled-system
styled-system-static
```

### cwd

**Type**: `string`

**Default**: `process.cwd()`

The current working directory.

```json
{
  "cwd": "src"
}
```

### clean

**Type**: `boolean`

**Default**: `false`

Whether to clean the output directory before generating the css.

```json
{
  "clean": false
}
```

### outdir

**Type**: `string`

**Default**: `styled-system`

The output directory for the generated css.

```json
{
  "outdir": "styled-system"
}
```

### importMap

**Type**: `string | Partial<OutdirImportMap>`

**Default**: `{ "css": "styled-system/css", "recipes": "styled-system/recipes", "patterns": "styled-system/patterns", "jsx": "styled-system/jsx" }`

Allows you to customize the import paths for the generated outdir.

```json
{
  "importMap": {
    "css": "@acme/styled-system",
    "recipes": "@acme/styled-system",
    "patterns": "@acme/styled-system",
    "jsx": "@acme/styled-system"
  }
}
```

You can also use a string to customize the base import path and keep the default entrypoints:

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

Check out the [Component Library](/docs/guides/component-library) guide for more information on how to use the `importMap` option.

### include

**Type**: `string[]`

**Default**: `[]`

List of files glob to watch for changes.

```json
{
  "include": ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"]
}
```

### exclude

**Type**: `string[]`

**Default**: `[]`

List of files glob to ignore.

```json
{
  "exclude": []
}
```

### dependencies

**Type**: `string[]`

**Default**: `[]`

Explicit list of config related files that should trigger a context reload on change.

> We automatically track the config file and (transitive) files imported by the config file as much as possible, but
> sometimes we might miss some. You can use this option as a workaround for those edge cases.

```json
{
  "dependencies": ["path/to/files/**.ts"]
}
```

### watch

**Type**: `boolean`

**Default**: `false`

Whether to watch for changes and regenerate the css.

```json
{
  "watch": false
}
```

### poll

**Type**: `boolean`

**Default**: `false`

Whether to use polling instead of filesystem events when watching.

```json
{
  "poll": false
}
```

### outExtension

**Type**: `'mjs' | 'js'`

**Default**: `mjs`

File extension for generated javascript files.

```json
{
  "outExtension": "mjs"
}
```

### forceConsistentTypeExtension

**Type**: `boolean`

**Default**: `false`

Whether to force consistent type extensions for generated typescript .d.ts files.

If set to `true` and `outExtension` is set to `mjs`, the generated typescript `.d.ts` files will have the extension `.d.mts`.

```json
{
  "forceConsistentTypeExtension": true
}
```

### syntax

**Type**: `'object-literal' | 'template-literal'`

**Default**: `object-literal`

Decides which syntax to use when writing CSS. For existing projects, you might need to run the `panda codegen --clean`.

```json
{
  "syntax": "template-literal"
}
```

Ex object-literal:

```tsx
const styles = css({
  backgroundColor: 'gainsboro',
  padding: '10px 15px'
})
```

Ex template-literal:

```tsx
const Container = styled.div`
  background-color: gainsboro;
  padding: 10px 15px;
`
```

### lightningcss

**Type**: `boolean`

**Default**: `false`

Whether to use `lightningcss` instead of `postcss` for css optimization.

```json
{
  "lightningcss": true
}
```

### browserslist

**Type**: `string[]`

**Default**: `[]`

Browserslist query to target specific browsers. Only used when `lightningcss` is set to `true`.

```json
{
  "browserslist": ["last 2 versions", "not dead", "not < 2%"]
}
```

### polyfill

**Type**: `boolean`

**Default**: `false`

Polyfill CSS @layers at-rules for older browsers.

```json
{
  "polyfill": true
}
```

## Design token options

### shorthands

**Type**: `boolean`

**Default**: `true`

Whether to allow shorthand properties

```json
{
  "shorthands": true
}
```

Ex `true`:

```tsx
const styles = css({
  bgColor: 'gainsboro',
  p: '10px 15px'
})
```

Ex false:

```tsx
const styles = css({
  backgroundColor: 'gainsboro',
  padding: '10px 15px'
})
```

### cssVarRoot

**Type**: `string`

**Default**: `:where(:host, :root)`

The root selector for the css variables.

```json
{
  "cssVarRoot": ":where(:host, :root)"
}
```

### conditions

**Type**: `Extendable<Conditions>`

**Default**: `{}`

The css selectors or media queries shortcuts.

```json
{
  "conditions": { "hover": "&:hover" }
}
```

### globalCss

**Type**: `Extendable<GlobalStyleObject>`

**Default**: `{}`

The global styles for your project.

```json
{
  "globalCss": {
    "html, body": {
      "margin": 0,
      "padding": 0
    }
  }
}
```

### theme

**Type**: `Extendable<Theme>`

**Default**: `{}`

The theme configuration for your project.

```json
{
  "theme": {
    "tokens": {
      "colors": {
        "red": { "value": "#EE0F0F" },
        "green": { "value": "#0FEE0F" }
      }
    },
    "semanticTokens": {
      "colors": {
        "danger": { "value": "{colors.red}" },
        "success": { "value": "{colors.green}" }
      }
    }
  }
}
```

### themes

**Type**: `Extendable<ThemeVariantsMap>`

**Default**: `{}`

The theme variants configuration for your project.

```json
{
  "themes": {
    "primary": {
      "tokens": {
        "colors": {
          "text": { "value": "red" }
        }
      },
      "semanticTokens": {
        "colors": {
          "muted": { "value": "{colors.red.200}" },
          "body": {
            "value": {
              "base": "{colors.red.600}",
              "_osDark": "{colors.red.400}"
            }
          }
        }
      }
    },
    "secondary": {
      "tokens": {
        "colors": {
          "text": { "value": "blue" }
        }
      },
      "semanticTokens": {
        "colors": {
          "muted": { "value": "{colors.blue.200}" },
          "body": {
            "value": {
              "base": "{colors.blue.600}",
              "_osDark": "{colors.blue.400}"
            }
          }
        }
      }
    }
  }
}
```

### utilities

**Type**: `Extendable<UtilityConfig>`

**Default**: `{}`

The css utility definitions.

```js
{
  "utilities": {
    extend: {
      borderX: {
        values: ['1px', '2px', '4px'],
        shorthand: 'bx', // `bx` or `borderX` can be used
        transform(value, token) {
          return {
            borderInlineWidth: value,
            borderColor: token('colors.red.200'), // read the css variable for red.200
          }
        },
      },
    },
  }
}
```

### patterns

**Type**: `Extendable<Record<string, AnyPatternConfig>>`

**Default**: `{}`

Common styling or layout patterns for your project.

```js
{
  "patterns": {
    extend: {
      // Extend the default `flex` pattern
      flex: {
        properties: {
          // only allow row and column
          direction: { type: 'enum', value: ['row', 'column'] },
        },
      },
    },
  },
}
```

### staticCss

**Type**: `StaticCssOptions`

**Default**: `{}`

Used to generate css utility classes for your project.

```js
{
  "staticCss": {
    css: [
      {
        properties: {
          margin: ['*'],
          padding: ['*', '50px', '80px'],
        },
        responsive: true,
      },
      {
        properties: {
          color: ['*'],
          backgroundColor: ['green.200', 'red.400'],
        },
        conditions: ['light', 'dark'],
      },
    ],
  },
}
```

### strictTokens

**Type**: `boolean`

**Default**: `false`

Only allow token values and prevent custom or raw CSS values. Will only affect properties that have config tokens, such as `color`, `bg`, `borderColor`, etc. [Learn more.](/docs/concepts/writing-styles#type-safety)

```json
{
  "strictTokens": false
}
```

### strictPropertyValues

**Type**: `boolean`

**Default**: `false`

Only use valid CSS values for properties that do have a predefined list of values. Will throw for properties that do not have config tokens, such as
`display`, `content`, `willChange`, etc. [Learn more.](/docs/concepts/writing-styles#type-safety)

```json
{
  "strictPropertyValues": false
}
```

### globalFontface

**Type**: `GlobalFontfaceDefinition`

**Default**: `{}`

Global font face definitions.

```json
{
  "globalFontface": {
    "Inter": {
      "src": "url(/fonts/inter.woff2) format('woff2')",
      "fontWeight": "400",
      "fontStyle": "normal"
    },
    "Roboto": {
      "src": "url(/fonts/roboto.woff2) format('woff2')",
      "fontWeight": "400",
      "fontStyle": "normal"
    }
  }
}
```

Check out the [Custom Fonts](/docs/guides/fonts#global-font-face) guide for more information on how to use the `globalFontface` option.

## JSX options

### jsxFramework

**Type**: `'react' | 'solid' | 'preact' | 'vue' | 'qwik' | (string & {})`

JS Framework for generated JSX elements.

```json
{
  "jsxFramework": "react"
}
```

### jsxFactory

**Type**: `string`

The factory name of the element

```json
{
  "jsxFactory": "panda"
}
```

Ex:

```tsx
<panda.button marginTop="40px">Click me</panda.button>
```

### jsxStyleProps

**Type**: `all` | `minimal` | `none`

**Default**: `all`

The style props allowed on generated JSX components

- When set to 'all', all style props are allowed.
- When set to 'minimal', only the `css` prop is allowed.
- When set to 'none', no style props are allowed and therefore the `jsxFactory` will not be usable as a component:
  - `<styled.div />` and `styled("div")` aren't valid
  - but the recipe usage is still valid `styled("div", { base: { color: "red.300" }, variants: { ...} })`

Ex with 'all':

```jsx
<styled.button marginTop="40px">Click me</styled.button>
```

Ex with 'minimal':

```jsx
<styled.button css={{ marginTop: '40px' }}>Click me</styled.button>
```

Ex with 'none':

```jsx
<button className={css({ marginTop: '40px' })}>Click me</button>
```

## Documentation options

### studio

**Type**: `Partial<Studio>`

**Default**: `{ title: 'Panda', logo: '🐼' }`

Used to customize the design system studio

```json
{
  "studio": {
    "logo": "🐼",
    "title": "Panda"
  }
}
```

### log level

**Type**: `'debug' | 'info' | 'warn' | 'error' | 'silent'`

**Default**: `info`

The log level for the built-in logger.

```json
{
  "logLevel": "info"
}
```

### validation

**Type**: `'none' | 'warn' | 'error'`

**Default**: `warn`

The validation strictness to use when validating the config.

- When set to 'none', no validation will be performed.
- When set to 'warn', warnings will be logged when validation fails.
- When set to 'error', errors will be thrown when validation fails.

```json
{
  "validation": "error"
}
```

## Other options

### Hooks

**Type**: `PandaHooks`

Panda provides a set of callbacks that you can hook into for more advanced use cases. Check the [Hooks](/docs/concepts/hooks) docs for more information.

### Plugins

**Type**: `PandaPlugin[]`

Plugins are currently simple objects that contain a `name` and a `hooks` object with the same structure as the `hooks` object in the config.

They will be called in sequence in the order they are defined in the `plugins` array, with the user's config called last.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  plugins: [
    {
      name: 'token-format',
      hooks: {
        'tokens:created': ({ configure }) => {
          configure({
            formatTokenName: path => '$' + path.join('-')
          })
        }
      }
    }
  ]
})
```
