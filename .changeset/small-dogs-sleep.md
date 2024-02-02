---
'@pandacss/config': patch
'@pandacss/types': patch
---

Add `utils` functions in the `config:resolved` hook, making it easy to apply transformations after all presets have been
merged.

For example, this could be used if you want to use most of a preset but want to completely omit a few things, while
keeping the rest. Let's say we want to remove the `stack` pattern from the built-in `@pandacss/preset-base`:

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  // ...
  hooks: {
    'config:resolved': ({ config, utils }) => {
      return utils.omit(config, ['patterns.stack'])
    },
  },
})
```
