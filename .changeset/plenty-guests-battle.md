---
'@pandacss/generator': patch
'@pandacss/fixture': patch
'@pandacss/config': patch
'@pandacss/types': patch
---

Introduce a new `cssVars` config option to define type-safe
[CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) and custom
[CSS @property](https://developer.mozilla.org/en-US/docs/Web/CSS/@property).

Example:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  cssVars: {
    '--some-color': 'red',
    '--button-color': {
      syntax: '<color>',
      inherits: false,
      initialValue: 'blue',
    },
  },
})
```

> Note: Keys defined in `cssVars` will be available as a value for _every_ utilities, as they're not bound to token
> categories.

```ts
import { css } from '@pandacss/react'

const className = css({
  '--button-color': 'colors.red.300',
  // ^^^^^^^^^^^^  will be suggested

  backgroundColor: 'var(--button-color)',
  //                ^^^^^^^^^^^^^^^^^^  will be suggested
})
```
