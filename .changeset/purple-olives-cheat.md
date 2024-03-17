---
'@pandacss/generator': patch
---

Fix `strictPropertyValues` typings should allow for `CssVars` (either predefined from `globalVars` or any custom CSS
variable)

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  strictPropertyValues: true,
  globalVars: {
    extend: {
      '--some-color': 'red',
      '--button-color': {
        syntax: '<color>',
        inherits: false,
        initialValue: 'blue',
      },
    },
  },
})
```

```ts
css({
  // ❌ was not allowed before when `strictPropertyValues` was enabled
  display: 'var(--button-color)', // ✅ will now be allowed/suggested
})
```

If no `globalVars` are defined, any `var(--*)` will be allowed

```ts
css({
  // ✅ will be allowed
  display: 'var(--xxx)',
})
```
