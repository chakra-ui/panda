---
'@pandacss/generator': patch
'@pandacss/types': patch
---

Introduce a new `extends` value for `strictTokens`

Setting this in your config will let you use the known values of a CSS property (in addition to the values defined in
your theme).

Example:

```ts
// panda.config.js
import { defineConfig } from '@pandacss/dev'
export default defineConfig({
  //...
  strictTokens: 'extends',
})

// app.tsx
import { css } from './styled-system/css'

css({ color: 'blue' }) // ✅ will work as `blue` is a native value for the CSS color property
css({ color: 'blue.300' }) // ✅ will work as `blue.300` is defined in your theme by default through the built-in `@pandacss/preset-panda`

// the global CSS values are also available
css({ color: 'initial' }) // ✅
css({ color: 'inherit' }) // ✅
css({ color: 'currentcolor' }) // ✅
css({ color: 'revert' }) // ✅
css({ color: 'revert-layer' }) // ✅
css({ color: 'unset' }) // ✅

// or another example with the width property
css({ width: 'min-content' }) // ✅
css({ width: 'max-content' }) // ✅

// and anything else will still not be allowed
css({ color: '#FFF' }) // ❌ will throw a type error
css({ width: '123px' }) // ❌ will throw a type error
```
