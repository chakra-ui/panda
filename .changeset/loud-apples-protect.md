---
'@pandacss/postcss': patch
---

Add support for setting config path in postcss

```js
module.exports = {
  plugins: [
    require('@pandacss/postcss')({
      configPath: './path/to/panda.config.js',
    }),
  ],
}
```
