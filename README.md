![Write typesafe styles with Panda](.github/assets/banner.png 'Write typesafe styles with Panda')

<p align="center">
  <br/>
  <a href="https://panda-css.com">Panda</a> is a universal styling solution for the modern web &mdash;
  <br/>
  build time, type safe, and scalable CSS-in-JS
  <br/><br/>
</p>

## Features

- ⚡️ Write style objects or style props, extract them at build time
- ✨ Modern CSS output — cascade layers `@layer`, css variables and more
- 🦄 Works with most JavaScript frameworks
- 🚀 Recipes and Variants - Just like Stitches™️ ✨
- 🎨 High-level design tokens support for simultaneous themes
- 💪 Type-safe styles and autocomplete (via codegen)

<br/>

---

<p align="center">
<b>
🐼 Get a taste of Panda. Try it out for yourself in&nbsp;
 <a href="https://stackblitz.com/edit/vitejs-vite-lfwyue?file=src%2FApp.tsx&terminal=dev">StackBlitz</a>
</b>
</p>

---

<br/>

## Documentation

Visit our [official documentation](https://panda-css.com/).

## Install

The **recommended** way to install the latest version of Astro is by running the command below:

```bash
npm i -D @pandacss/dev
```

To scaffold the panda config and postcss

```bash
npx panda init -p
```

Start the dev server of your project

```bash
npm run dev
```

Start using panda

```jsx
import { css } from '../styled-system/css'
import { stack, vstack, hstack } from '../styled-system/patterns'

function Example() {
  return (
    <div>
      <div className={hstack({ gap: '30px', color: 'pink.300' })}>Box 1</div>
      <div className={css({ fontSize: 'lg', color: 'red.400' })}>Box 2</div>
    </div>
  )
}
```

## Directory Structure

| Package                                       | Description                                                 |
| --------------------------------------------- | ----------------------------------------------------------- |
| [cli](packages/cli)                           | CLI package installed by the end user                       |
| [core](packages/core)                         | Contains core features of Panda (utility, recipes, etc)     |
| [config](packages/config)                     | Contains functions for reading and merging the panda config |
| [extractor](packages/extractor)               | Contains code for fast AST parsing and scanning             |
| [generator](packages/generator)               | Contains codegen artifacts (js, css, jsx)                   |
| [parser](packages/parser)                     | Contains code for parsing a source code                     |
| [is-valid-prop](packages/is-valid-prop)       | Contains code for checking if a prop is a valid css prop    |
| [node](packages/node)                         | Contains the Node.js API of Panda's features                |
| [token-dictionary](packages/token-dictionary) | Contains code used to process tokens and semantic tokens    |
| [shared](packages/shared)                     | Contains shared TS functions                                |

## Support

Having trouble? Get help in the official [Panda Discord](https://panda-css.com/discord).
