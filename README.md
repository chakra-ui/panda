# Panda

The universal design system solution for the web

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
yarn install @pandacss/dev
```

To scaffold the panda config and postcss

```sh
pnpm panda init
# or
pnpm panda init --postcss
```

To run the extract styles, run

```sh
pnpm panda
# or
pnpm panda --watch
```

When you change the config, you may need to regenerate the system

```sh
pnpm panda codegen
```

## Usage

```js
import { css } from '../design-system/css'
import { stack, vstack, hstack } from '../design-system/patterns'
```

```jsx
import { css } from '../design-system/css'
import { stack, vstack, hstack } from '../design-system/patterns'

function Example() {
  return (
    <div>
      <div className={hstack({ gap: '30px', color: 'pink.300' })}>Box 1</div>
      <div className={css({ fontSize: 'lg', color: 'red.400' })}>Box 2</div>
    </div>
  )
}
```
