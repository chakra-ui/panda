---
'@pandacss/parser': patch
'@pandacss/core': patch
---

- Prevent extracting style props of `styled` when not explicitly imported

- Allow using multiple aliases for the same identifier for the `/css` entrypoints just like `/patterns` and `/recipes`

```ts
import { css } from '../styled-system/css'
import { css as css2 } from '../styled-system/css'

css({ display: 'flex' })
css2({ flexDirection: 'column' }) // this wasn't working before, now it does
```
