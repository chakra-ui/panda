---
'@pandacss/config': minor
'@pandacss/types': minor
'@pandacss/node': minor
'@pandacss/dev': minor
---

- BREAKING: The built-in presets `@pandacss/preset-base` and `@pandacss/preset-panda` are no longer automatically
  included, if you are not using `presets` or `eject` in your config you can add them manually as shown below:

```diff
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
+  presets: ['@pandacss/preset-base', '@pandacss/preset-panda'],
})
```

This allows you to control more explicitely which presets are included in your project.

- BREAKING: The `config.eject` option has been removed. Simply remove it from your config and the result will be the
  same.

```diff
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
-  eject: true,
})
```
