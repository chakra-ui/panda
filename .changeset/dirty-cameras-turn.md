---
'@pandacss/core': patch
---

Allow referencing tokens with the `token()` function in media queries or any other CSS at-rule.

```js
import { css } from '../styled-system/css'

const className = css({
  '@media screen and (min-width: token(sizes.4xl))': {
    color: 'green.400',
  },
})
```
