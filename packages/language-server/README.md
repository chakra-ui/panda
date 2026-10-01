# @pandacss/language-server

A [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) server that adds completions and
diagnostics while you author your [Panda CSS](https://panda-css.com) config, for editors that don't load TypeScript
plugins.

> **Experimental:** this package is not stable. Its behavior may change in any release, and it does not support
> TypeScript 7 yet.

## Installation

```bash
npm install -D @pandacss/language-server
```

## Usage

Point your editor's LSP client at the `panda-language-server` binary over stdio:

```bash
panda-language-server --stdio
```

## Documentation

Visit the [Panda CSS documentation](https://panda-css.com) to learn more.

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
