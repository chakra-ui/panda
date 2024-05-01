---
'@pandacss/preset-base': minor
'@pandacss/generator': minor
'@pandacss/parser': minor
---

**BREAKING 💥**

Remove `linkBox` pattern in favor of using adding `position: relative` when using the `linkOverlay` pattern.

**Before**

```jsx
import { linkBox, linkOverlay } from 'styled-system/patterns'

const App = () => {
  return (
    <div className={linkBox()}>
      <img src="https://via.placeholder.com/150" alt="placeholder" />
      <a href="#" className={linkOverlay()}>
        Link
      </a>
    </div>
  )
}
```

**After**

```jsx
import { css } from 'styled-system/css'
import { linkOverlay } from 'styled-system/patterns'

const App = () => {
  return (
    <div className={css({ pos: 'relative' })}>
      <img src="https://via.placeholder.com/150" alt="placeholder" />
      <a href="#" className={linkOverlay()}>
        Link
      </a>
    </div>
  )
}
```
