---
title: Config Functions
description: Functions to expose types for your config.
---

# Config Functions

These Config Functions, help in defining and providing type information for your config. By utilizing these functions, you can enhance code readability, enforce consistency, and ensure robust type checking in config.

## Config Creators

To help defining config in a type-safe way, you can use the following helpers:

### `defineConfig`

Function for [config](/docs/references/config) definitions.

```ts filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  theme: {},
  include: ['src/**/*.{js,jsx,ts,tsx}']
})
```

### `defineRecipe`

Function for [recipe](/docs/concepts/recipes#config-recipe) definitions.

```ts
import { defineRecipe } from '@pandacss/dev'

export const buttonRecipe = defineRecipe({
  className: 'button',
  description: 'The styles for the Button component',
  base: {
    display: 'flex'
  },
  variants: {
    visual: {
      funky: { bg: 'red.200', color: 'white' },
      edgy: { border: '1px solid {colors.red.500}' }
    }
  },
  defaultVariants: {
    visual: 'funky',
    size: 'sm'
  }
})
```

### `defineSlotRecipe`

Function for [slot recipe](/docs/concepts/slot-recipes#config-slot-recipe) definitions.

```ts
import { defineSlotRecipe } from '@pandacss/dev'

export const checkboxRecipe = defineSlotRecipe({
  className: 'checkbox',
  description: 'The styles for the Checkbox component',
  slots: ['root', 'control', 'label'],
  base: {
    root: { display: 'flex', alignItems: 'center', gap: '2' },
    control: { borderWidth: '1px', borderRadius: 'sm' },
    label: { marginStart: '2' }
  },
  variants: {
    size: {
      sm: {
        control: { width: '8', height: '8' },
        label: { fontSize: 'sm' }
      },
      md: {
        control: { width: '10', height: '10' },
        label: { fontSize: 'md' }
      }
    }
  },
  defaultVariants: {
    size: 'sm'
  }
})
```

### `defineParts`

It can be useful when you want to have the equivalent of a slot recipe without needing to split the class names bindings and instead just having a className that handles children on 1 DOM element.

It pairs well with [ZagJs](https://zagjs.com/) and [Ark-UI](https://ark-ui.com/)

Let's refactor the previous example to use parts instead of slots:

```ts
import { defineParts, definetRecipe } from '@pandacss/dev'

const parts = defineParts({
  root: { selector: '& [data-part="root"]' },
  control: { selector: '& [data-part="control"]' },
  label: { selector: '& [data-part="label"]' }
})

export const checkboxRecipe = defineRecipe({
  className: 'checkbox',
  description: 'A checkbox style',
  base: parts({
    root: { display: 'flex', alignItems: 'center', gap: '2' },
    control: { borderWidth: '1px', borderRadius: 'sm' },
    label: { marginStart: '2' }
  }),
  variants: {
    size: {
      sm: parts({
        control: { width: '8', height: '8' },
        label: { fontSize: 'sm' }
      }),
      md: parts({
        control: { width: '10', height: '10' },
        label: { fontSize: 'md' }
      })
    }
  },
  defaultVariants: {
    size: 'sm'
  }
})
```

### `definePattern`

Function for [pattern](/docs/customization/patterns) definitions.

```ts
import { definePattern } from '@pandacss/dev'

const visuallyHidden = definePattern({
  transform(props) {
    return {
      srOnly: true,
      ...props
    }
  }
})
```

### `definePreset`

Function for [preset](/docs/customization/presets#creating-a-preset) definitions.

```ts
import { definePreset } from '@pandacss/dev'

export const pandaPreset = definePreset({
  theme: {
    extend: {
      tokens: {
        colors: { primary: { value: 'blue.500' } }
      }
    }
  }
})
```

### `defineKeyframes`

Function for [keyframes](/docs/customization/theme#keyframes) definitions.

```ts
import { defineKeyframes } from '@pandacss/dev'

export const keyframes = defineKeyframes({
  fadeIn: {
    '0%': { opacity: '0' },
    '100%': { opacity: '1' }
  }
})
```

### `defineGlobalStyles`

Function for [global styles](/docs/concepts/writing-styles#global-styles) definitions.

```ts
import { defineGlobalStyles } from '@pandacss/dev'

const globalCss = defineGlobalStyles({
  'html, body': {
    color: 'gray.900',
    lineHeight: '1.5'
  }
})
```

### `defineUtility`

Function for [utility](/docs/customization/utilities) definitions.

```ts
import { defineUtility } from '@pandacss/dev'

export const br = defineUtility({
  className: 'rounded',
  values: 'radii',
  transform(value) {
    return { borderRadius: value }
  }
})
```

### `defineTextStyles`

Function for [text styles](/docs/theming/text-styles) definitions.

```ts
import { defineTextStyles } from '@pandacss/dev'

export const textStyles = defineTextStyles({
  body: {
    description: 'The body text style - used in paragraphs',
    value: {
      fontFamily: 'Inter',
      fontWeight: '500',
      fontSize: '16px',
      lineHeight: '24',
      letterSpacing: '0',
      textDecoration: 'None',
      textTransform: 'None'
    }
  }
})
```

### `defineLayerStyles`

Function for [layer styles](/docs/theming/layer-styles) definitions.

```ts
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

### `defineStyles`

Function for [style](/) definitions.

This comes in handy when you want to define reusable styles in the config.

E.g. a set of styles to be used in multiple variants within a [recipe](/docs/concepts/recipes#config-recipe).

```ts {3, 14, 18} filename="recipes/button.ts"
import { defineRecipe, defineStyles } from '@pandacss/dev'

const buttonVisualStyles = defineStyles({
  borderRadius: 'lg',
  boxShadow: 'sm'
})

export const buttonRecipe = defineRecipe({
  // ...
  variants: {
    visual: {
      funky: {
        bg: 'red.200',
        color: 'white',
        ...buttonVisualStyles
      },
      edgy: {
        border: '1px solid {colors.red.500}',
        ...buttonVisualStyles
      }
    }
  }
})
```

## Token Creators

To help defining tokens in a type-safe way, you can use the following helpers:

### `defineTokens`

```ts
import { defineTokens } from '@pandacss/dev'

const theme = {
  tokens: defineTokens({
    colors: {
      primary: { value: '#ff0000' }
    }
  })
}
```

You can also use this function to define tokens in a separate file:

```ts filename="tokens/colors.ts"
import { defineTokens } from '@pandacss/dev'

export const colors = defineTokens.colors({
  primary: { value: '#ff0000' }
})
```

### `defineSemanticTokens`

```ts
import { defineSemanticTokens } from '@pandacss/dev'

const theme = {
  semanticTokens: defineSemanticTokens({
    colors: {
      primary: {
        value: { _light: '{colors.blue.400}', _dark: '{colors.blue.200}' }
      }
    }
  })
}
```

You can also use this function to define tokens in a separate file:

```ts filename="tokens/colors.semantic.ts"
import { defineSemanticTokens } from '@pandacss/dev'

export const colors = defineSemanticTokens.colors({
  primary: {
    value: { _light: '{colors.blue.400}', _dark: '{colors.blue.200}' }
  }
})
```
