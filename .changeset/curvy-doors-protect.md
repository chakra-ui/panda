---
'@pandacss/generator': patch
'@pandacss/config': patch
'@pandacss/types': patch
'@pandacss/core': patch
---

Add a way to create config conditions with nested at-rules/selectors

```ts
export default defaultConfig({
  conditions: {
    extend: {
      supportHover: ['@media (hover: hover) and (pointer: fine)', '&:hover'],
    },
  },
})
```

```ts
import { css } from '../styled-system/css'

css({
  _supportHover: {
    color: 'red',
  },
})
```

will generate the following CSS:

```css
@media (hover: hover) and (pointer: fine) {
  &:hover {
    color: red;
  }
}
```
