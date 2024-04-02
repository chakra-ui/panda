---
'@pandacss/generator': patch
'@pandacss/studio': patch
'@pandacss/types': patch
---

- Fix an issue where the `compoundVariants` classes would not be present at runtime when using `config recipes`

```ts
// panda.config.ts
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {
    extend: {
      recipes: {
        button: {
          // ...
          variants: {
            size: {
              sm: {
                fontSize: 'sm',
              },
              // ...
            },
          },
          compoundVariants: [
            {
              size: 'sm',
              css: { color: 'blue.100'},
            },
          ],
        },
      },
    },
  },
})

// app.tsx
const Button = styled('button', button)

const App = () => {
  return (
    // ❌ this would only have the classes `button button--size_sm`
    // the `text_blue` was missing
    // ✅ it's now fixed -> `button button--size_sm text_blue`
    <Button size="sm">Click me</Button>
  )
}
```

- Add a `getVariantProps` helper to the recipes API (`cva` and `config recipes`)

```ts
import { cva } from '../styled-system/css'
import { getVariantProps } from '../styled-system/recipes'

const button = cva({
    // ...
  variants: {
    size: {
      sm: {
        fontSize: 'sm',
      },
      md: {
        fontSize: 'md',
      },
    },
    variant: {
      primary: {
        backgroundColor: 'blue.500',
      },
      danger: {
        backgroundColor: 'red.500',
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
