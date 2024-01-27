---
'@pandacss/token-dictionary': patch
'@pandacss/preset-base': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add new `cq` pattern in `@pandacss/preset-base` (included by default)

```ts
// 1 - Define container conditions

export default defineConfig({
  // ...
  theme: {
    containerNames: ['sidebar', 'content'],
    containerSizes: {
      xs: '40em',
      sm: '60em',
      md: '80em',
    },
  },
})
```

```ts
// 2 - Automatically generate container query pattern

import { cq } from 'styled-system/patterns'

function Demo() {
  return (
    <nav className={cq({ name: 'sidebar' })}>
      <div
        className={css({
          // When the sidebar container reaches the `sm` size
          // change font size to `md`
          fontSize: { base: 'lg', '@sidebar/sm': 'md' },
        })}
      />
    </nav>
  )
}
```
