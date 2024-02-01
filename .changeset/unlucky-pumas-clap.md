---
'@pandacss/astro-plugin-studio': patch
'@pandacss/token-dictionary': patch
'@pandacss/generator': patch
'@pandacss/fixture': patch
'@pandacss/postcss': patch
'@pandacss/config': patch
'@pandacss/logger': patch
'@pandacss/parser': patch
'@pandacss/studio': patch
'@pandacss/types': patch
'@pandacss/core': patch
'@pandacss/node': patch
'@pandacss/dev': patch
---

- Add a `--logfile` flag to the `panda`, `panda codegen`, `panda cssgen` and `panda debug` commands.
- Add a `logfile` option to the postcss plugin

Logs will be streamed to the file specified by the `--logfile` flag or the `logfile` option. This is useful for
debugging issues that occur during the build process.

```sh
panda --logfile ./logs/panda.log
```

```js
module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {
      logfile: './logs/panda.log',
    },
  },
}
```
