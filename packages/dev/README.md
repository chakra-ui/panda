# @pandacss/dev

The user-facing package for [Panda CSS](https://panda-css.com). This is the package most projects install — it provides
the `panda` CLI, the config helpers (`defineConfig`, `defineRecipe`, …), and convenient subpath entrypoints.

## Installation

```bash
npm install -D @pandacss/dev
```

## Usage

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: true,
  include: ['./src/**/*.{ts,tsx}'],
})
```

```bash
panda codegen
```

### Subpaths

- `@pandacss/dev` — config helpers (`defineConfig`, `defineRecipe`, …)
- `@pandacss/dev/node` — config loading + compiler APIs for tooling
- `@pandacss/dev/postcss` — the PostCSS plugin (re-export of `@pandacss/postcss`)
- `@pandacss/dev/cli` — programmatic command runners

## Documentation

Visit the [Panda CSS documentation](https://panda-css.com) to learn more.

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
