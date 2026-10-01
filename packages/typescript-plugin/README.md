# @pandacss/typescript-plugin

A TypeScript language service plugin that adds completions and diagnostics while you author your
[Panda CSS](https://panda-css.com) config.

> **Experimental:** this package is not stable. Its behavior may change in any release, and it does not support
> TypeScript 7 yet.

## Installation

```bash
npm install -D @pandacss/typescript-plugin
```

## Usage

Add the plugin to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [{ "name": "@pandacss/typescript-plugin" }]
  }
}
```

In VS Code, make sure the editor uses the workspace TypeScript version so it loads the plugin.

## Documentation

Visit the [Panda CSS documentation](https://panda-css.com) to learn more.

## License

MIT © [Chakra Systems Inc.](https://github.com/chakra-ui)
