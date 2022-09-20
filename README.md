# CSS panda

The universal design system solution for enterprise team.

## Features

- Styled system to generate css utility classes
- Consume the utilities in a strongly typed `css` function
- Token management
  - Analyze token usage across your project
  - VSCode extension to view tokens in your IDE
- Token export
  - css, less, saas variables
  - json object
  - js module
- Quality check
  - Ensure all engineers use the specified tokens
  - Checkes css, js{x}, ts{x}, less and sass files for tokens
- Common layout helpers
  - stack, flex, grid
  - visually hidden, no scroll, etc

## Getting Started

```sh
yarn install css-panda
```

## Ideas

User creates a `panda.config.ts` file at the root of their project

```jsx
// chakra.config.ts

import { defineConfig } from 'css-panda'

export default defineConfig({
  outfile: 'styles.css',
  prefix: 'ck',
  incremental: true,
  content: ['src/components/*.tsx'],

  keyframes: { spin: {} },

  breakpoints: {
    sm: '420px',
    md: '768px',
    lg: '960px',
    xl: '1200px',
  },

  conditions: {
    light: { '@media': '(prefers-color-scheme: light)' },
    dark: { '@media': '(prefers-color-scheme: light)' },
    focus: { selector: '&:focus-visible' },
    hover: { selector: ['&:hover', '&[data-hover]'] },
    motionSafe: { '@media': '(prefers-reduced-motion: reduce)' },
  },

  tokens: {
    colors: {},
    fonts: {},
    fontSizes: {},
    animations: {},
    durations: {},
  },

  semanticTokens: {
    error: {
      lightMode: '',
      darkMode: '',
    },
  },

  utilities: [
    {
      properties: {
        display: ['none', 'flex', 'grid', 'inline-flex', 'block', 'inline-block'],
        alignItems: ['flex-start', 'center', 'flex-end'],
        alignContent: ['center', 'stretch'],
        justifyContent: ['flex-start', 'center', 'flex-end', 'space-between'],
        flexDirection: ['row', 'column'],
        flex: ['0', '1'],
        flexShrink: ['0', '1', '2'],
        flexWrap: ['nowrap', 'wrap'],
      },
      shorthands: {
        d: ['display'],
      },
    },
    {
      conditions: ['light', 'dark'],
      properties: {
        backgroundColor: ($) => $('colors'),
        borderColor: ($) => $('colors'),
        color: ($) => $('colors'),
      },
      shorthands: {
        bg: ['backgroundColor'],
        background: ['backgroundColor'],
      },
    },
    {
      properties: {
        boxShadow: shadows,
      },
    },
    {
      properties: {
        width: ($) => ({
          ...$('sizes'),
          screen: '100vw',
          auto: 'auto',
        }),
        minWidth: {
          unset: 'unset',
          0: '0px',
          full: '100%',
          min: 'min-content',
          max: 'max-content',
          fit: 'fit-content',
        },
        minHeight: {
          unset: 'unset',
          0: '0px',
          full: '100%',
          screen: '100vh',
          min: 'min-content',
          max: 'max-content',
          fit: 'fit-content',
        },
      },
    },
  ],
})
```

User runs a command to generate the initial css file that contains all css utility classes for the tokens

```bash
css-panda init
```

This will output a css file in the specified `outfile`.

> By default, we can consider setting the output to `.css-panda/styles.css`

```css
/* styles.css */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.color-green-500 {
  color: #hex;
}
```

This will also out a strongly typed module at `.css-panda/css`

```jsx
import { css, cx } from '.css-panda/css'

function App() {
  return <div className={css({ bg: '$red.200' })} />
}
```

The token related artifacts are exposed at `.css-panda/token`

```jsx
import { $ } from '.css-panda/token'

function App() {
  return <div style={{ background: $('colors.green.400') }} />
}
```

The token getter function can be used in different ways

```jsx
// get by scale and value.
const red200 = $('colors', 'red.200') // evaluate `colors.red.200` but return `red.200` if not found
const red200 = $('colors.red.200')
```

The user can now run a command to watch the specified `content` and extract new classes as needed.

```bash
css-panda src/ --watch
```

## Custom css rule

User can combine all css declaration into a single rule instead of atomic classes.

Add the `label` option. This approach will allow users pass arbitrary rules, and selectors

> This approach might bloat the size of the final css

```jsx
import { apply, $ } from '.css-panda/css'

function App() {
  return (
    <div
      className={apply('btn', {
        vars: {
          'btn-size': { _: '0', hover: $('colors.red.400') },
        },
        bg: { _: '$red.200', hover: '$red.500' },
        margin: { _: '40px', md: '-$6' },
      })}
    />
  )
}
```

```css
.btn--root {
  background: 'red.200';
}

.btn--root:hover: {
  background: 'red.500';
}
```

## Global styles

```jsx
import { globalStyle } from '.css-panda/css'

globalStyle('html, body', {})
```

## Adding font face styles

```jsx live=false
import { fontFace } from '.css-panda/css'

fontFace('Inter UI', {
  src: 'local("Comic Sans MS")',
})
```

To generate the final build output, user can run

- minify will reduce the css to the smallest amount possible using Britoli compression
- purge will remove unused or duplicate styles by checking the `.cache/css-panda/.buildinfo` file

```sh
css-panda --minify --purge
```

## Visualization

To visualize the tokens used within the system, the user can run. This command will serve the token docs in
`localhost:5000`

```sh
css-panda --visualize
```

## Reporting

To report the usage of tokens in a project, the user can run

```sh
css-panda --report=json
```

The reporter can be either json, html or xml. The reporter will scrape the entire project to find area where hard-coded
and design tokens are used.

## Other CLI options

`--config`: The path to the config file, by default, we'll search for the closest config file. `--list`: List the files
what will be processed. `--version`: Show the version. `--force`: Bust the cache and create clean build artifacts.
`--strict`: Generate strict output type for tokens

## CSS Handling

The `css` provides an interface to interact with design tokens.

- Supports css variables
- Supports nested conditions (responsive, pseudo-elements, hover, focus, etc)
- Generates atomic classes
- Configure class names via config

```js
const styles = css({
  vars: {
    '--testing': { sm: '4px', md: '5px' },
  },
  padding: { sm: '4', hover: '6' },
  color: { light: { sm: 'green.200', md: 'green.60' }, dark: 'pink.400' },
  content: { after: '40px', before: '6' },
})

const out = [
  {
    className: { raw: 'sm:padding-4', formatted: 'sm\\:padding-4' },
    conditions: ['sm'],
    value: '4',
    prop: 'padding',
    _original: `{ sm: "4", hover: "6" }`,
  },
]
```

```css
sm:padding-4 hover:padding-6
dark:color-pink-400 md:light:color-green-60 sm:light:color-green-200
```

```css
@screen (sm) {
  .sm:padding-4 {
    padding: "$4";
  }
}

@screen (sm){
    @hover {
        sm
    }
}
```

## Layout helpers

```js
import { grid, stack, pseudo, divide, cx, shadow, filter, transform, gradient } from '.css-panda'

function Example() {
  return (
    <div>
      <div className={grid({ columns: 12 })}>
        <div className={grid.item({ colSpan: 8 })}>1</div>
        <div>1</div>
        <div>1</div>
      </div>

      <div className={pseudo({ before: {}, after: {}, placeholder: {} })}>
        <div>1</div>
      </div>

      <div className={cx(stack({ align: 'start' }))}>
        <div>1</div>
      </div>

      <div
        className={gradient({
          direction: 'to-r',
          from: 'blue.500',
          via: 'red.400',
          to: 'blue.600',
        })}
      >
        text
      </div>
    </div>
  )
}
```

```js
// panda.config.ts
const tokens = {
  colors: {
    red: '#red',
  },
  fonts: {
    lg: '45px',
  },
}

export default defineConfig({
  tokens,
})
```

```bash
panda init
```

- `.css-panda`
  - `package.json`
  - `dist`
  - `style.css`
  - `css.js`

```css
/* System generated - non-token classes */

/* User generated - token classes */
.bg-color-red {
  background-color: '#red';
}

.color-red {
  color: '#red';
}

.border-color-red {
  border-color: '#red';
}

/* Generate the media query version (light and dark mode) */
```

```ts
import 'css-panda/style.css'

import { css } from 'css-panda'

const className = css({
  display: { sm: 'flex', md: 'none' },
  backgroundColor: 'red',
  borderColor: 'red',
})

const out = 'bg-color-red border-color-red sm:display-flex md:display-none'
```

```jsx
<Box display={{ sm: "flex", md: "none" }} backgroundColor="red" borderColor="red" />
<Box css={{ display: { sm: "flex", md: "none" }, backgroundColor: "red", borderColor: "red" }} />
```

```bash
panda build --minify
panda tokens --open
```

```jsx
const ss = css({
  backgroundColor: "red300",
  vars: {},
  selectors: {},
  "@media": {
    ""
  },
  "@container": {},
});
```
