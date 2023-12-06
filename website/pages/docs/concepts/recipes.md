---
title: Recipes
description: Panda provides a way to write CSS-in-JS with better performance, developer experience, and composability.
---

# Recipes

Panda provides a way to write CSS-in-JS with better performance, developer experience, and composability. One of its key features is the ability to create multi-variant styles with a type-safe runtime API.

A recipe consists of four properties:

- `base`: The base styles for the component
- `variants`: The different visual styles for the component
- `compoundVariants`: The different combinations of variants for the component
- `defaultVariants`: The default variant values for the component

> **Credit:** This API was inspired by [Stitches](https://stitches.dev/), [Vanilla Extract](https://vanilla-extract.style/), and [Class Variance Authority](https://cva.style/).

## Atomic Recipe (or cva)

Atomic recipes are a way to create multi-variant atomic styles with a type-safe runtime API.

They are defined using the `cva` function which was inspired by [Class Variance Authority](https://cva.style/). The `cva` function which takes an object as its argument.

> **Note:** `cva` is not the same as [Class Variance Authority](https://cva.style/). The `cva` from Panda is a purpose-built function for creating atomic recipes that are connected to your design tokens and utilities.

### Defining the recipe

```jsx
import { cva } from '../styled-system/css'

const button = cva({
  base: {
    display: 'flex'
  },
  variants: {
    visual: {
      solid: { bg: 'red.200', color: 'white' },
      outline: { borderWidth: '1px', borderColor: 'red.200' }
    },
    size: {
      sm: { padding: '4', fontSize: '12px' },
      lg: { padding: '8', fontSize: '24px' }
    }
  }
})
```

### Using the recipe

The returned value from the `cva` function is a function that can be used to apply the recipe to a component. Here's an
example of how to use the `button` recipe:

```jsx
import { button } from './button'

const Button = () => {
  return (
    <button className={button({ visual: 'solid', size: 'lg' })}>
      Click Me
    </button>
  )
}
```

When a recipe is created, Panda will extract and generate CSS for every variant and compoundVariant `css` ahead of time, as atomic classes.

```css
@layer utilities {
  .d_flex {
    display: flex;
  }

  .bg_red_200 {
    background-color: #fed7d7;
  }

  .color_white {
    color: #fff;
  }

  .border_width_1px {
    border-width: 1px;
  }
  /* ... */
}
```

### Setting the default variants

The `defaultVariants` property is used to set the default variant values for the recipe. This is useful when you want to apply a variant by default. Here's an example of how to use `defaultVariants`:

```jsx
import { cva } from '../styled-system/css'

const button = cva({
  base: {
    display: 'flex'
  },
  variants: {
    visual: {
      solid: { bg: 'red.200', color: 'white' },
      outline: { borderWidth: '1px', borderColor: 'red.200' }
    },
    size: {
      sm: { padding: '4', fontSize: '12px' },
      lg: { padding: '8', fontSize: '24px' }
    }
  },
  defaultVariants: {
    visual: 'solid',
    size: 'lg'
  }
})
```

### Compound Variants

Compound variants are a way to combine multiple variants together to create more complex sets of styles. They are defined using the `compoundVariants` property , which takes an array of objects as its argument. Each object in the array represents a set of conditions that must be met in order for the corresponding styles to be applied.

Here's an example of how to use `compoundVariants` in Panda:

```js
import { cva } from '../styled-system/css'

const button = cva({
  base: {
    padding: '8px 16px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold'
  },

  variants: {
    size: {
      small: {
        fontSize: '14px',
        padding: '4px 8px'
      },
      medium: {
        fontSize: '16px',
        padding: '8px 16px'
      },
      large: {
        fontSize: '18px',
        padding: '12px 24px'
      }
    },
    color: {
      primary: {
        backgroundColor: 'blue',
        color: 'white'
      },
      secondary: {
        backgroundColor: 'gray',
        color: 'black'
      }
    },
    disabled: {
      true: {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    }
  },

  // compound variants
  compoundVariants: [
    // apply when both small size and primary color are selected
    {
      size: 'small',
      color: 'primary',
      css: {
        border: '2px solid blue'
      }
    },
    // apply when both large size and secondary color are selected and the button is disabled
    {
      size: 'large',
      color: 'secondary',
      disabled: true,
      css: {
        backgroundColor: 'lightgray',
        color: 'darkgray',
        border: 'none'
      }
    },
    // apply when both small or medium size, and secondary color variants are applied
    {
      size: ['small', ' medium'],
      color: 'secondary',
      css: {
        fontWeight: 'extrabold'
      }
    }
  ]
})
```

Here's an example usage of the `button` recipe:

```jsx
import { button } from './button'

const Button = () => {
  // will apply size: small, color: primary, css: { border: '2px solid blue' }
  return (
    <button className={button({ size: 'small', color: 'primary' })}>
      Click Me
    </button>
  )
}
```

Overall, using compound variants allows you to create more complex sets of styles that can be applied to your components based on multiple conditions.

By combining simple variants together in this way, you can create a wide range of visual styles without cluttering up your code with lots of conditional logic.

### TypeScript Guide

Panda provides a `RecipeVariantProps` type utility that can be used to infer the variant properties of a recipe.

This is useful when you want to use the recipe in JSX and want to get type safety for the variants.

```tsx
import { styled } from '../styled-system/jsx'
import { cva, type RecipeVariantProps } from '../styled-system/css'

const buttonStyle = cva({
  base: {
    color: 'red',
    textAlign: 'center'
  },
  variants: {
    size: {
      small: {
        fontSize: '1rem'
      },
      large: {
        fontSize: '2rem'
      }
    }
  }
})

export type ButtonVariants = RecipeVariantProps<typeof buttonStyle> // { size?: 'small' | 'large' }

export const Button = styled('button', buttonStyle)
```

### Usage in JSX

You can create a JSX component from any existing atomic recipe by using the `styled` function from the `/jsx` entrypoint.

The `styled` function takes the element type as its first argument, and the recipe as its second argument.

> Make sure to add the `jsxFramework` option to your `panda.config` file, and run `panda codegen` to generate the JSX entrypoint.

```js
import { cva } from '../styled-system/css'
import { styled } from '../styled-system/jsx'

const buttonStyle = cva({
  base: {
    color: 'red',
    textAlign: 'center'
  },
  variants: {
    size: {
      small: {
        fontSize: '1rem'
      },
      large: {
        fontSize: '2rem'
      }
    }
  }
})

const Button = styled('button', buttonStyle)
```

Then you can use the component in JSX

```jsx
<Button size="large">Click me</Button>
```

## Config Recipe

Config recipes are extracted and generated just in time, this means regardless of the number of recipes in the config, only the recipes and variants you use will exist in the generated CSS.

The config recipe takes the following additional properties:

- `className`: The name of the recipe. Used in the generated class name
- `jsx`: An array of JSX components that use the recipe. Defaults to the uppercase version of the recipe name
- `description`: An optional description of the recipe (used in the js-doc comments)

> As of v0.9, the `name` property is removed in favor of `className`

### Defining the recipe

To define a config recipe, import the `defineRecipe` helper function

```jsx filename="button.recipe.ts"
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
    },
    size: {
      sm: { padding: '4', fontSize: '12px' },
      lg: { padding: '8', fontSize: '40px' }
    },
    shape: {
      square: { borderRadius: '0' },
      circle: { borderRadius: 'full' }
    }
  },
  defaultVariants: {
    visual: 'funky',
    size: 'sm',
    shape: 'circle'
  }
})
```

### Adding recipe to config

To add the recipe to the config, you’d need to add it to the `theme.recipes` object.

```jsx filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'
import { buttonRecipe } from './button.recipe'

export default defineConfig({
  //...
  jsxFramework: 'react',
  theme: {
    extend: {
      recipes: {
        button: buttonRecipe
      }
    }
  }
})
```

### Generate JS code

This generates a recipes folder the specified `outdir` which is `styled-system` by default. If Panda doesn’t
automatically generate your CSS file, you can run the `panda codegen` command.

You only need to import the recipes into the component files where you need to use them.

### Using the recipe

To use the recipe, you can import the recipe from the `<outdir>/recipes` entrypoint and use it in your component. Panda
tracks the usage of the recipe and only generates CSS of the variants used in your application.

```js
import { button } from '../styled-system/recipes'

function App() {
  return (
    <div>
      <button className={button()}>Click me</button>
      <button className={button({ shape: 'circle' })}>Click me</button>
    </div>
  )
}
```

The generated css is registered under the `recipe` [cascade layer](/docs/concepts/cascade-layers.mdx) with the class name that matches the recipe-variant name pattern `<recipe-className>--<variant-name>`.

> **Technical Notes 📝:** Only the recipe and variants used in your application are generated. Not more!

```css
@layer recipes {
  @layer base {
    .button {
      font-size: var(--font-sizes-lg);
    }
  }

  .button--visual-funky {
    background-color: var(--colors-red-200);
    color: var(--colors-white);
  }

  .button--size-lg {
    padding: var(--space-8);
    font-size: var(--font-sizes-40px);
  }
}
```

### Responsive and Conditional variants

Recipes created in the config have a **special** feature; they can be applied based on a specific breakpoints or conditions.

Here's how to tweak the size variant of the button recipe based on breakpoints.

```jsx
import { button } from '../styled-system/recipes'

function App() {
  return (
    <div>
      <button className={button({ size: { base: 'sm', md: 'lg' } })}>
        Click me
      </button>
    </div>
  )
}
```

> In most cases, we don't recommend applying conditional variants inline. Ideally, you might want to render different views for your responsive breakpoints.

### TypeScript Guide

Every recipe ships a type interface for its accepted variants. You can import them from the `styled-system/recipes` entrypoint.

For the button recipe, we can import the `ButtonVariants` type like so:

```ts
import React from 'react'
import type { ButtonVariants } from '../styled-system/recipes'

type ButtonProps = ButtonVariants & {
  children: React.ReactNode
}
```

### Usage in JSX

Layer recipes can be consumed directly in your custom JSX components. Panda will automatically track the usage of the recipe if the component name matches the recipe name.

For example, if your recipe is called `button` and you create a `Button` component from it, Panda will automatically track the usage of the variant properties.

```tsx
import React from 'react'
import { button, type ButtonVariants } from '../styled-system/recipes'

type ButtonProps = ButtonVariants & {
  children: React.ReactNode
}

const Button = (props: ButtonProps) => {
  const { children, size } = props
  return (
    <button {...props} className={button({ size })}>
      {children}
    </button>
  )
}

const App = () => {
  return (
    <div>
      <Button size="lg">Click me</Button>
    </div>
  )
}
```

### Advanced JSX Tracking

We recommend that you use the recipe functions in most cases, in design systems there might be a need to compose existing components (like Button) to create new components.

To track the usage of the recipes in these cases, you'll need to add the `jsx` hint for the recipe config

```js {12} filename="button.recipe.ts"
import { defineRecipe } from '@pandacss/dev'

const button = defineRecipe({
  base: {
    color: 'red',
    fontSize: '1.5rem'
  },
  variants: {
    // ...
  },
  // Add the jsx hint to track the usage of the recipe in JSX, you can use regex to match multiple components
  jsx: ['Button', 'PageButton']
})
```

Then you can create a new component that uses the `Button` component and Panda will track the usage of the `button` recipe as well.

```tsx
const PageButton = (props: ButtonProps) => {
  const { children, size } = props
  return (
    <Button {...props} size={size}>
      {children}
    </Button>
  )
}
```

## Methods and Properties

Both atomic and config recipe ships a helper methods and properties that can be used to get information about the recipe.

- `variantKeys`: An array of the recipe variant keys
- `variantMap`: An object of the recipe variant keys and their values
- `splitVariantProps`: A function that takes an object as its argument and returns an array containing the recipe variant props and the rest of the props

```js
import { cva } from '../styled-system/css'

const buttonRecipe = cva({
  base: {
    color: 'red',
    fontSize: '1.5rem'
  },
  variants: {
    size: {
      sm: {
        fontSize: '1rem'
      },
      md: {
        fontSize: '2rem'
      }
    }
  }
})

buttonRecipe.variantKeys
// => ['size']

buttonRecipe.variantMap
// => { size: ['sm', 'md'] }

buttonRecipe.splitVariantProps({ size: 'sm', onClick() {} })
// => [{ size: 'sm'}, { onClick() {} }]
```

These methods and properties are useful when creating custom components or writing Storybook stories for your recipes.

Here's a Storybook example.

```tsx filename="button.stories.tsx"
import { Button, buttonRecipe } from './components/button'

export default {
  title: 'Button',
  component: Button,
  argTypes: {
    size: {
      control: {
        type: 'select',
        options: buttonRecipe.variantMap.size
      }
    }
  }
}

export const Demo = {
  render: args => <Button {...args}>Click me</Button>
}
```

## Best Practices

- Leverage css variables in the base styles as much as possible. Makes it easier to theme the component with JS
- Don't mix styles by writing complex selectors. Separate concerns and group them in logical variants
- Use the `compoundVariants` property to create more complex sets of styles

## Limitations

- Recipes created from `cva` cannot have responsive or conditional values. Only layer recipes can have responsive or conditional values.

- Due to static nature of Panda, it's not possible to track the usage of the recipes in all cases. Here are some of use cases that Panda won't be able to track the usage of the recipe variants:

  **When you change the name of the variant prop in the JSX component**

  ```tsx
  const Button = ({ buttonSize, children }) => {
    return (
      <button {...props} className={button({ size: buttonSize })}>
        {children}
      </button>
    )
  }
  ```

  **When you use the recipe in a custom component that is not a JSX component, Panda won't be able to track the usage of the recipe variants.**

  ```tsx
  const Random = ({ size, children }) => {
    return (
      <button {...props} className={button({ size })}>
        {children}
      </button>
    )
  }
  ```

- When using `compoundVariants` in the recipe, you're not able to use responsive values in the variants.

```tsx
const button = defineRecipe({
  base: {
    color: 'red',
    fontSize: '1.5rem'
  },
  variants: {
    size: {
      sm: {
        fontSize: '1rem'
      },
      md: {
        fontSize: '2rem'
      }
    }
  },
  // this  will disable responsive values for the variants
  compoundVariants: [
    {
      size: 'sm',
      visual: 'funky',
      css: {
        color: 'blue'
      }
    },
    {
      size: 'md',
      visual: 'funky',
      css: {
        color: 'green'
      }
    }
  ]
})
```

## Static CSS

Panda provides a way to generate `static CSS` for your recipes. This is useful when you want to generate CSS for a recipe without using the recipe in your code or if you use dynamic styling that Panda can't keep track of.

More information about static CSS can be found [here](/docs/guides/static.md#generating-recipes).

## Should I use atomic or config recipes ?

[Config recipes](/docs/concepts/recipes#config-recipe) are generated just in time, meaning that only the recipes and variants you use will exist in the generated CSS, regardless of the number of recipes in the config.

This contrasts with [Atomic recipes](/docs/concepts/recipes#atomic-recipe-or-cva) (cva), which generates all of the variants regardless of what was used in your code. The reason for this difference is that all `config.recipes` are known at the start of the panda process when we evaluate your config.

In contrast, the CVA recipes are scattered throughout your code. To get all of them and find their usage across your code, we would need to scan your app code multiple times, which would not be ideal performance-wise.

When dealing with simple use cases, or if you need code colocation, or even avoiding dynamic styling, atomic recipes shine by providing all style variants. Config recipes are preferred for design system components, delivering leaner CSS with only the styles used. Choose according to your component needs.

|                                                        | Config recipe                                                               | Atomic recipe (cva)                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Can both use any theme tokens, utilities or conditions | ✅ yes                                                                      | ✅ yes                                                                   |
| Are generated just in time (JIT) based on usage        | ✅ yes, only the recipe variants found in your code will be generated       | ❌ no, all variants found in your `cva` recipes will always be generated |
| Can be shared in a preset                              | ✅ yes, you can include it in your `preset.theme.recipes`                   | ❌ no                                                                    |
| Can be colocated in your markup code                   | ❌ no, they must be defined or imported in your `panda.config`              | ✅ yes, you can place it anywhere in your app                            |
| Generate atomic classes                                | ❌ no, a specific className will be generated using your `recipe.className` | ✅ yes                                                                   |
