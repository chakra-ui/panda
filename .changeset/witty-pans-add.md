---
'@pandacss/generator': minor
'@pandacss/types': minor
---

Add support for element level css reset via `preflight.level`. Learn more
[here](https://github.com/chakra-ui/panda/discussions/1992).

Setting `preflight.level` to `'element'` applies the reset directly to the individual elements that have the scope class
assigned.

```js
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  preflight: {
    scope: '.my-scope',
    level: 'element', // 'element' | 'parent (default)'
  },
  // ...
})
```

This will generate CSS that looks like:

```css
button.my-scope {
}

img.my-scope {
}
```

This approach allows for more flexibility, enabling selective application of CSS resets either to an entire parent
container or to specific elements within a container.
