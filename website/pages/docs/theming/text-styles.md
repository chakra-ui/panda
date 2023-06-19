---
title: Text Styles
description: Typography forms the core of any interface design, making it important to establish patterns for consistent and legible typography early in the development process. This will also help you avoid duplicating typography properties.
---

# Text Styles

Typography forms the core of any interface design, making it important to establish patterns for consistent and legible typography early in the development process. This will also help you avoid duplicating typography properties.

Text styles allows you to define textual css properties. The common peoperties are:

- The font family, weight, size
- Line height
- Letter spacing
- Text Decoration (strikethrough and underline)
- Text Transform (uppercase, lowercase, and capitalization)

## Defining text styles

Text styles are defined in the `textStyles` property of the theme.

Here's an example of a text style:

```js filename="text-styles.ts"
import { defineTextStyles } from '@pandacss/dev'

const textStyles = defineTextStyles({
  body: {
    description: 'The body text style - used in paragraphs',
    value: {
      fontFamily: 'Inter',
      fontWeight: '500',
      fontSize: '16',
      lineHeight: '24',
      letterSpacing: '0',
      textDecoration: 'None',
      textTransform: 'None'
    }
  }
})
```

> **Good to know:** The `value` property maps to style objects that will be applied to the text.

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

## Using text styles

Now we can use `textStyle` property in our components.

```jsx
import { css } from '../styled-system/css'

function App() {
  return (
    <p className={css({ textStyle: 'body' })}>
      This is a paragraph from Panda with the body text style.
    </p>
  )
}
```

## Best Practices

To ensure the consistency of your design system, it's important to avoid adding layout properties (margin, padding,
etc.) or color properties (background, colors, etc.) to the text styles.

### Naming text styles

In practice, we recommend using the same text style names used by designers on your team. Here are common ideas on how to name text styles:

- Sized-based naming system (`xs`, `sm`, `md`, `lg`, `xl`)
- Semantic naming system that corresponds to respective html tags in production (`caption`, `paragraph`, `h1`, `h2`)
- Descriptive or functional naming system that explains the style's intended use (`alert`, `modal-header`, `button-label`)
