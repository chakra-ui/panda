# @pandacss/bun

The [Bun](https://bun.sh) plugin for [Panda CSS](https://panda-css.com), with an inline compiler — no separate codegen
step required.

## Installation

```bash
bun add -D @pandacss/bun
```

## Usage

### Fullstack app (`Bun.serve` + HTML imports)

```toml
# bunfig.toml
[serve.static]
plugins = ["@pandacss/bun"]
```

### `Bun.build`

```ts
import panda from '@pandacss/bun'

await Bun.build({
  entrypoints: ['./src/index.html'],
  outdir: './dist',
  plugins: [panda],
})
```

The `bun build` command line doesn't run plugins, so build through `Bun.build` for production.

To pass options, export a configured plugin from a file and point Bun at it:

```ts
// panda.plugin.ts
import { pandacss } from '@pandacss/bun'

export default pandacss({ transform: true })
```

```toml
[serve.static]
plugins = ["./panda.plugin.ts"]
```

In the dev server, an edited module hot-reloads together with its new styles.

### `bun run` / `bun test`

Register the same plugin from a preload file and await it, so codegen finishes before your entry loads:

```ts
// panda-preload.ts
import { register } from '@pandacss/bun'

await register()
```

```toml
# bunfig.toml
preload = ["./panda-preload.ts"]

[test]
preload = ["./panda-preload.ts"]
```

Without options, the ready-made entry does the same:

```toml
preload = ["@pandacss/bun/preload"]
```

Bun's runtime doesn't process CSS, so `bun run` and `bun test` get codegen and the optional source rewrite; the
stylesheet injection applies to `Bun.build`. Source transforms stay behind `transform: true`, same as the Vite and
webpack plugins.

## Documentation

Visit the [Panda CSS documentation](https://panda-css.com) to learn more.

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
