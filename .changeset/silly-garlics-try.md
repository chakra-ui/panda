---
'@pandacss/generator': patch
'@pandacss/parser': patch
'@pandacss/studio': patch
---

Improved styled factory by adding a 3rd (optional) argument:

```ts
interface FactoryOptions<TProps extends Dict> {
  dataAttr?: boolean
  defaultProps?: TProps
  shouldForwardProp?(prop: string, variantKeys: string[]): boolean
}
```

- Setting `dataAttr` to true will add a `data-recipe="{recipeName}"` attribute to the element with the recipe name. This
  is useful for testing and debugging.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button, { dataAttr: true })

const App = () => (
  <Button variant="secondary" mt="10px">
    Button
  </Button>
)
// Will render something like <button data-recipe="button" class="btn btn--variant_purple mt_10px">Button</button>
```

- `defaultProps` allows you to skip writing wrapper components just to set a few props. It also allows you to locally
  override the default variants or base styles of a recipe.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'

const Button = styled('button', button, {
  defaultProps: {
    variant: 'secondary',
    px: '10px',
  },
})

const App = () => <Button>Button</Button>
// Will render something like <button class="btn btn--variant_secondary px_10px">Button</button>
```

- `shouldForwardProp` allows you to customize which props are forwarded to the underlying element. By default, all props
  except recipe variants and style props are forwarded.

```jsx
import { styled } from '../styled-system/jsx'
import { button } from '../styled-system/recipes'
import { isCssProperty } from '../styled-system/jsx'
import { motion, isValidMotionProp } from 'framer-motion'

const StyledMotion = styled(
  motion.div,
  {},
  {
    shouldForwardProp: (prop, variantKeys) =>
      isValidMotionProp(prop) || (!variantKeys.includes(prop) && !isCssProperty(prop)),
  },
)
```
