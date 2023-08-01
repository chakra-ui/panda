---
'@pandacss/generator': minor
'@pandacss/fixture': minor
'@pandacss/parser': minor
'@pandacss/shared': minor
'@pandacss/studio': minor
'@pandacss/types': minor
'@pandacss/core': minor
'@pandacss/dev': minor
---

Introduce new slot recipe features.

Slot recipes are useful for styling composite or multi-part components easily.

- `sva`: the slot recipe version of `cva`
- `defineSlotRecipe`: the slot recipe version of `defineRecipe`

**Definition**

```jsx
import { sva } from 'styled-system/css'

const button = sva({
  slots: ['label', 'icon'],
  base: {
    label: { color: 'red', textDecoration: 'underline' },
  },
  variants: {
    rounded: {
      true: {},
    },
    size: {
      sm: {
        label: { fontSize: 'sm' },
        icon: { fontSize: 'sm' },
      },
      lg: {
        label: { fontSize: 'lg' },
        icon: { fontSize: 'lg', color: 'pink' },
      },
    },
  },
  defaultVariants: {
    size: 'sm',
  },
})
```

**Usage**

```jsx
export function App() {
  const btnClass = button({ size: 'lg', rounded: true })

  return (
    <button>
      <p class={btnClass.label}> Label</p>
      <p class={btnClass.icon}> Icon</p>
    </button>
  )
}
```
