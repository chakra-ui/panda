---
'@pandacss/postcss': minor
---

Add `allow` config option in postcss plugin.

The plugin won't parse css files in node modules. This config option lets you opt out of that for some paths.

```js
//postcss.config.cjs

module.exports = {
  plugins: {
    '@pandacss/dev/postcss': {
      allow: [/node_modules\/.embroider/],
    },
  },
}
```
