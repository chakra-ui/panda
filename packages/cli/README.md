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
panda init      # scaffold a config
panda dev       # watch files and rebuild
panda build     # generate the styled-system and CSS
panda check     # check generated files without writing
panda info      # show project and compiler info
panda doctor    # check config + diagnostics
panda debug     # write debug artifacts for bug reports

# Advanced
panda codegen    # generate the styled-system only
panda cssgen     # generate CSS only
panda buildinfo  # emit a portable build manifest
```

Use `--log-level silent|error|warn|info|debug` to control CLI output. Compiler tracing is separate: `--trace`,
`--trace-output` (`fmt` summary or `chrome-json` file), and `--trace-file`.

## Documentation

Visit the [Panda CSS documentation](https://panda-css.com) to learn more.

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
