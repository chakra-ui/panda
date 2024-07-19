---
'@pandacss/generator': minor
'@pandacss/types': minor
'@pandacss/core': minor
---

Add support for defining global font face in config and preset

```ts
// pandacss.config.js
export default defineConfig({
  globalFontface: {
    Roboto: {
      src: 'url(/fonts/roboto.woff2) format("woff2")',
      fontWeight: '400',
      fontStyle: 'normal',
    },
  },
})
```

You can also add multiple font `src` for the same weight

```ts
// pandacss.config.js

export default defineConfig({
  globalFontface: {
    Roboto: {
      // multiple src
      src: ['url(/fonts/roboto.woff2) format("woff2")', 'url(/fonts/roboto.woff) format("woff")'],
      fontWeight: '400',
      fontStyle: 'normal',
    },
  },
})
```

You can also define multiple font weights

```ts
// pandacss.config.js

export default defineConfig({
  globalFontface: {
    // multiple font weights
    Roboto: [
      {
        src: 'url(/fonts/roboto.woff2) format("woff2")',
        fontWeight: '400',
        fontStyle: 'normal',
      },
      {
        src: 'url(/fonts/roboto-bold.woff2) format("woff2")',
        fontWeight: '700',
        fontStyle: 'normal',
      },
    ],
  },
})
```
