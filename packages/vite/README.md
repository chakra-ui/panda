# @pandacss/vite

The [Vite](https://vite.dev) plugin for [Panda CSS](https://panda-css.com), with an inline compiler — no separate
codegen step required.

## Installation

```bash
npm install -D @pandacss/vite
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import panda from '@pandacss/vite'

export default defineConfig({
  plugins: [panda()],
})
```

## Documentation

Visit the [Panda CSS documentation](https://panda-css.com) to learn more.

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
