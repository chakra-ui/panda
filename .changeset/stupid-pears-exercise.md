---
'@pandacss/generator': patch
'@pandacss/studio': patch
---

Automatically allow overriding config recipe compoundVariants styles within the `styled` JSX factory, example below

With this config recipe:

```ts file="panda.config.ts"
const button = defineRecipe({
  className: 'btn',
  base: { color: 'green', fontSize: '16px' },
  variants: {
    size: { small: { fontSize: '14px' } },
  },
  compoundVariants: [{ size: 'small', css: { color: 'blue' } }],
})
```

This would previously not merge the `color` property overrides, but now it does:

```tsx file="example.tsx"
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button)

function App() {
  return (
    <>
      <Button size="small" color="red.100">
        Click me
      </Button>
    </>
  )
}
```

- Before: `btn btn--size_small text_blue text_red.100`
- After: `btn btn--size_small text_red.100`
