![Write typesafe styles with Panda](.github/assets/banner.png 'Write typesafe styles with Panda')

<p align="center">
  <br/>
  <a href="https://panda-css.com">Panda</a> is a universal styling solution for the modern web &mdash;
  <br/>
  build time, type safe, and scalable CSS-in-JS
  <br/><br/>
  <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/%40pandacss%2Fdev"> <img alt="NPM Version" src="https://img.shields.io/npm/v/%40pandacss%2Fdev"> <img alt="X (formerly Twitter) Follow" src="https://img.shields.io/twitter/follow/panda__css">
  
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

## 🐼 Panda v2

Panda v2 is here, with the compiler rewritten in Rust on the Oxc engine. Upgrading from v1? Follow the
**[upgrade guide](https://panda-css.com/docs/get-started/upgrading-to-v2)**.

## Documentation

Visit our [official documentation](https://panda-css.com/).

## Install

The **recommended** way to install the latest version of Panda is by running the command below:

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

| Package                                         | Description                                                  |
| ----------------------------------------------- | ------------------------------------------------------------ |
| [dev](packages/dev)                             | User-facing package: config helpers and the `panda` binary   |
| [cli](packages/cli)                             | The `panda` CLI, powered by the Rust compiler                |
| [compiler](packages/compiler)                   | Native Rust binding for the compiler engine                  |
| [compiler-wasm](packages/compiler-wasm)         | WebAssembly binding for the compiler engine (browser target) |
| [config](packages/config)                       | Loads, bundles, and serializes the panda config              |
| [types](packages/types)                         | Public types                                                 |
| [postcss](packages/postcss)                     | PostCSS plugin                                               |
| [vite](packages/vite)                           | Vite plugin                                                  |
| [webpack](packages/webpack)                     | webpack plugin (Next.js compatible)                          |
| [rollup](packages/rollup)                       | Rollup plugin                                                |
| [bun](packages/bun)                             | Bun plugin                                                   |
| [preset-base](packages/preset-base)             | Base preset with conditions and utilities                    |
| [preset-panda](packages/preset-panda)           | Default theme preset                                         |
| [preset-typography](packages/preset-typography) | Prose typography preset                                      |
| [eslint-plugin](packages/eslint-plugin)         | ESLint rules                                                 |
| [mcp](packages/mcp)                             | MCP server for AI assistants                                 |
| [crates](crates)                                | Rust compiler engine built on Oxc                            |

## Contributing

Feel like contributing? That's awesome! We have a [contributing guide](./CONTRIBUTING.md) to help guide you.

### Want to help improve the docs?

Our docsite lives in the [monorepo](./website/content/docs/).

If you're interested in contributing to the documentation, check out the [contributing guide](./CONTRIBUTING.md).

## Support

Having trouble? Get help in the official [Panda Discord](https://discord.gg/VQrkpsgSx7).

## Acknowledgement

The development of Panda was only possible due to the inspiration and ideas from these amazing projects.

- [Chakra UI](https://chakra-ui.com/) - where it all started
- [Vanilla Extract](https://vanilla-extract.style/) - for inspiring the utilities API
- [Stitches](https://stitches.dev/) - for inspiring the recipes and variants API
- [Tailwind CSS](https://tailwindcss.com/) - for inspiring the JIT compiler and strategy
- [Class Variance Authority](https://cva.style/) - for inspiring the `cva` name
- [Styled System](https://github.com/styled-system/styled-system) - for the initial idea of Styled Props
- [Linaria](https://linaria.dev/) - for inspiring the initial atomic css strategy
- [StyleX](https://stylexjs.com/) - for inspiring the `firstThatWorks()` name and argument order
- [Oxc](https://oxc.rs/) - for the parser, semantic analysis and resolver behind the Rust compiler
- [Rolldown](https://rolldown.rs/) - for config bundling, the plugin hook filters and the design notes format
- [NAPI-RS](https://napi.rs/) - for the native and WebAssembly bindings

## License

MIT License © 2023-Present [Segun Adebayo](https://github.com/segunadebayo)
