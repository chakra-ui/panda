# @pandacss/cli

The Panda CSS command-line interface, powered by the Rust compiler. Ships the `panda` and `pandacss` binaries.

Most users should install [`@pandacss/dev`](https://www.npmjs.com/package/@pandacss/dev) instead, which re-exports this
CLI alongside the config helpers. Install `@pandacss/cli` directly if you only need the binary.

## Installation

```bash
npm install -D @pandacss/cli
```

## Usage

```bash
panda init        # scaffold a config
panda codegen     # generate the styled-system
panda cssgen      # generate CSS
panda inspect     # inspect compiler state
panda validate    # validate config + diagnostics
panda buildinfo   # emit a portable build manifest
```

## Documentation

Visit the [Panda CSS documentation](https://panda-css.com) to learn more.

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
