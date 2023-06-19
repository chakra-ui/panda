---
title: Layer Styles
description: Layer styles provide a way to create consistent and visually appealing elements. By defining a set of properties and effects, you can easily apply them to various design elements, ensuring visual coherence throughout your design system.
---

# Layer Styles

Layer styles provide a way to create consistent and visually appealing elements. By defining a set of properties and effects, you can easily apply them to various design elements, ensuring visual coherence throughout your design system.

- Color or text color
- Background color
- Border width and border color
- Box shadow
- Opacity

## Defining layer styles

Layer styles are defined in the `layerStyles` property of the theme.

Here's an example of a layer style:

```js filename="layer-styles.ts"
import { defineLayerStyles } from '@pandacss/dev'

const layerStyles = defineLayerStyles({
  container: {
    description: 'container styles',
    value: {
      bg: 'gray.50',
      border: '2px solid',
      borderColor: 'gray.500'
    }
  }
})
```

> **Good to know:** The `value` property maps to style objects that will be applied to the element.

## Update the config

To use the text styles, we need to update the `config` object in the `panda.config.ts` file.

```js filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'
import { textStyles } from './text-styles'

export default defineConfig({
  theme: {
    extend: {
      textStyles
    }
  }
})
```

This should automatically update the generated theme the specified `textStyles`. If this doesn't happen, you can run the `panda codegen` command.

## Using layer styles

Now we can use `layerStyle` property in our components.

```jsx
function App() {
  return (
    <div className={css({ layerStyle: 'container' })}>
      This is inside a container style
    </div>
  )
}
```
