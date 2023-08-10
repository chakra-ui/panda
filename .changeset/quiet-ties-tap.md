---
'@pandacss/preset-base': minor
---

Add new visually hidden and bleed patterns.

### Bleed

Bleed is a layout pattern is used to negate the padding applied to a parent container. You can apply an `inline` or
`block` bleed to a child element, setting its value to match the parent's padding.

```tsx
import { css } from '../styled-system/css'
import { bleed } from '../styled-system/patterns'

export function Page() {
  return (
    <div class={css({ px: '6' })}>
      <div class={bleed({ inline: '6' })}>Welcome</div>
    </div>
  )
}
```

### Visually Hidden

Visually hidden is a layout pattern used to hide content visually, but still make it available to screen readers.

```tsx
import { css } from '../styled-system/css'
import { visuallyHidden } from '../styled-system/patterns'

export function Checkbox() {
  return (
    <label>
      <input type="checkbox" class={visuallyHidden()}>
        I'm hidde
      </input>
      <span>Checkbox</span>
    </label>
  )
}
```
