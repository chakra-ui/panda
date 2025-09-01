---
'@pandacss/preset-base': minor
---

Added new transition values and enhanced transition property utilities

- `size` → `width, height, min-width, max-width, min-height, max-height`
- `position` → `left, right, top, bottom, inset, inset-inline, inset-block`
- `background` → `background, background-color, background-image, background-position`

```tsx
import { css } from 'styled-system/css'

// Transition shorthand values
css({ transition: 'size' })

// Property groups
css({ transitionProperty: 'size', transitionDuration: '300ms' })
```
