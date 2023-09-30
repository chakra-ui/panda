---
'@pandacss/postcss': patch
'@pandacss/node': patch
---

Adds a new `silent` boolean option to the PostCSS plugin to suppress all output.

```js
module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {
      silent: true,
    },
  },
}
```
