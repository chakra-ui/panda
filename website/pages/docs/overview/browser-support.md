---
title: Browser Support
description: Learn about the browser support for Panda
---

# Browser Support

Panda CSS is built with modern CSS features and uses [PostCSS](https://postcss.org/) to add support for older browsers.

Panda supports the latest, stable releases of major browsers that support the following features:

- [CSS Variables](https://caniuse.com/#feat=css-variables)
- [CSS Cascade Layers](https://caniuse.com/css-variables)
- Modern selectors, such as [:where()](https://caniuse.com/mdn-css_selectors_where) and [:is()](https://caniuse.com/css-matches-pseudo)

## Browserlist

Based on the above criteria, the following browsers are supported:

```txt
>= 1%
last 1 major version
not dead
Chrome >= 99
Edge >= 99
Firefox >= 97
iOS >= 15.4
Safari >= 15.4
Android >= 115
Opera >= 73
```

## Polyfills

In event that you need to support older browsers, you can use the following polyfills in your PostCSS config:

- [autoprefixer](https://github.com/postcss/autoprefixer): Adds vendor prefixes to CSS rules using values from [Can I Use](https://caniuse.com/).
- [postcss-cascade-layers](https://www.npmjs.com/package/@csstools/postcss-cascade-layers): Adds support for CSS Cascade Layers.

Here is an example of a `postcss.config.js` file that uses these polyfills:

```js
module.exports = {
  plugins: [
    '@pandacss/dev/postcss',
    'autoprefixer',
    '@csstools/postcss-cascade-layers'
  ]
}
```
