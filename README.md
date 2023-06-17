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

Setup and import the entry CSS file

```css
@layer reset, base, tokens, recipes, utilities;
```

```jsx
import 'path/to/entry.css'
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

Having trouble? Get help in the official [Panda Discord](https://discord.gg/VQrkpsgSx7).

## Acknowledgement

The development of Panda was only possible due to the inspiration and ideas from these amazing projects.

- [Chakra UI](https://chakra-ui.com/) - where it all started
- [Vanilla Extract](https://vanilla-extract.style/) - for inspiring the utilities API
- [Stitches](https://stitches.dev/) - for inspiring the recipes and variants API
- [Tailwind CSS](https://tailwindcss.com/) - for inspiring the JIT compiler and strategy
- [Class Variant Authority](https://cva.style/) - for inspiring the `cva` name
- [Styled System](https://styled-system.com/) - for the initial idea of Styled Props
- [Linaria](https://linaria.dev/) - for inspiring the initial atomic css strategy
- [Uno CSS](https://unocss.dev/) - for inspiring the studio and astro integration

## License

MIT License © 2023-Present [Segun Adebayo](https://github.com/segunadebayo)
