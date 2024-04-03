---
'@pandacss/generator': patch
'@pandacss/types': patch
---

- Fix `sva` typings, the `splitVariantProps` was missing from the `d.ts` file
- Add a `getVariantProps` helper to the slot recipes API (`sva` and `config slot recipes`)

```ts
import { sva } from '../styled-system/css'
import { getVariantProps } from '../styled-system/recipes'

const button = sva({
  slots: ['root', 'icon'],
  // ...
  variants: {
    size: {
      sm: {
        // ...
      },
      md: {
        // ...
      },
    },
    variant: {
      primary: {
        // ...
      },
      danger: {
        // ...
      }
    }
  }
  defaultVariants: {
    size: 'md',
    variant: 'primary',
  }
})

// ✅ this will return the computed variants based on the defaultVariants + props passed
const buttonProps = button.getVariantProps({ size: "sm" })
//    ^? { size: "sm", variant: "primary" }
```
