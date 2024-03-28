---
'@pandacss/types': minor
'@pandacss/core': minor
---

Allow multiple `importMap` (or multiple single import entrypoints if using the object format).

It can be useful to use a component library's `styled-system` while also using your own `styled-system` in your app.

```ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  importMap: ['@acme/styled-system', '@ui-lib/styled-system', 'styled-system'],
})
```

Now you can use any of the `@acme/styled-system`, `@ui-lib/styled-system` and `styled-system` import sources:

```ts
import { css } from '@acme/css'
import { css as uiCss } from '@ui-lib/styled-system/css'
import { css as appCss } from '@ui-lib/styled-system/css'
```
