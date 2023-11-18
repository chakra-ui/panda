---
title: Slot Recipes
description: Learn how to style multiple parts components with slot recipes.
---

# Slot Recipes

Slot Recipes come in handy when you need to apply style variations to multiple parts of a component. While using `cva` or `defineRecipe` might be enough for simple cases, slot recipes are a better fit for more complex cases.

A slot recipe consists of these properties:

- `slots`: An array of component parts to style
- `base`: The base styles per slot
- `variants`: The different visual styles for each slot
- `defaultVariants`: The default variant for the component
- `compoundVariants`: The compound variant combination and style overrides for each slot.

> **Credit:** This API was inspired by multipart components in [Chakra UI](https://chakra-ui.com/docs/styled-system/component-style) and slot variants in [Tailwind Variants](tailwind-variants.org)

## Atomic Slot Recipe (or sva)

The `sva` function is a shorthand for creating a slot recipe with atomic variants. It takes the same arguments as `cva` but returns a slot recipe instead.

### Defining the Recipe

```jsx filename="checkbox.recipe.ts"
import { sva } from '../styled-system/css'

const checkbox = sva({
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

### Using the recipe

The returned value from `sva` is a function that can be used to apply the recipe for each component part. Here's an
example of how to use the `checkbox` recipe:

```jsx filename="Checkbox.tsx"
import { css } from '../styled-system/css'
import { checkbox } from './checkbox.recipe'

const Checkbox = () => {
  const classes = checkbox({ size: 'sm' })
  return (
    <label className={classes.root}>
      <input type="checkbox" className={css({ srOnly: true })} />
      <div className={classes.control} />
      <span className={classes.label}>Checkbox Label</span>
    </label>
  )
}
```

When a slot recipe is created, Panda will pre-generate the css of all the possible combinations of variants and compound variants as atomic classes.

```css
@layer utilities {
  .border_width_1px {
    border-width: 1px;
  }

  .rounded_sm {
    border-radius: var(--radii-sm);
  }

  .margin_start_2 {
    margin-inline-start: var(--spacing-2);
  }

  .w_8 {
    width: var(--sizing-8);
  }

  .h_8 {
    height: var(--sizing-8);
  }

  .font_size_sm {
    font-size: var(--fontSizes-sm);
  }

  .w_10 {
    width: var(--sizing-10);
  }

  .h_10 {
    height: var(--sizing-10);
  }

  .font_size_md {
    font-size: var(--fontSizes-md);
  }
  /* ... */
}
```

### Compound Variants

Compound variants are a way to apply style overrides to a slot based on the combination of variants.

Let's say you want to apply a different border color to the checkbox control based on the size and the checked state. Here's how you would do it:

```jsx filename="checkbox.recipe.ts" {14-22}
import { sva } from '../styled-system/css'
const checkbox = sva({
  slots: ['root', 'control', 'label'],
  base: {...},
  variants: {
    size: {
      sm: {...},
      md: {...}
    },
    isChecked: {
      true: { control: {}, label: {} }
    }
  },
  compoundVariants: [
    {
      size: 'sm',
      isChecked: true,
      css: {
        control: { borderColor: 'green-500' }
      }
    }
  ],
  defaultVariants: {...}
})
```

### TypeScript Guide

Panda provides a `RecipeVariantProps` type utility that can be used to infer the variant properties of a slot recipe.

This is useful when you want to use the recipe in JSX and want to get type safety for the variants.

```tsx
import { sva, type RecipeVariantProps } from '../styled-system/css'

const checkbox = sva({...})

export type CheckboxVariants = RecipeVariantProps<typeof checkbox>
//  => { size?: 'sm' | 'md', isChecked?: boolean }
```

### Usage in JSX

Unlike the atomic recipe or `cva`, slot recipes are not meant to be used directly in the `styled` factory since it returns an object of classes instead of a single class.

```jsx
import { css } from '../styled-system/css'
import { styled } from '../styled-system/jsx'
import { checkbox, type CheckboxVariants } from './checkbox.recipe'

// ❌ Won't work
const Checkbox = styled('label', checkbox)

// ✅ Works
const Checkbox = (props: CheckboxVariants) => {
  const classes = checkbox(props)
  return (
    <label className={classes.root}>
      <input type="checkbox" className={css({ srOnly: true })} />
      <div className={classes.control} />
      <span className={classes.label}>Checkbox Label</span>
    </label>
  )
}
```

### Styling JSX Compound Components

Compound components are a great way to create reusable components for better composition. Slot recipes play nicely with this pattern and requires a context provider for the component.

> **Note:** This is an advanced topic and you don't need to understand it to use slot recipes. If you use React, be aware that context require adding 'use client' to the top of the file.

Let's say you want to design a Checkbox component that can be used like this:

```jsx
<Checkbox size="sm|md" isChecked>
  <Checkbox.Control />
  <Checkbox.Label>Checkbox Label</Checkbox.Label>
</Checkbox>
```

First, create a shared context for ths styles

```jsx filename="style-context.tsx"
'use client'
import { createContext, forwardRef, useContext } from 'react'

export const createStyleContext = recipe => {
  const StyleContext = createContext(null)

  const withProvider = (Component, part) => {
    const Comp = forwardRef((props, ref) => {
      const [variantProps, rest] = recipe.splitVariantProps(props)
      const styles = recipe(variantProps)
      return (
        <StyleContext.Provider value={styles}>
          <Component ref={ref} className={styles?.[part ?? '']} {...rest} />
        </StyleContext.Provider>
      )
    })
    Comp.displayName = Component.displayName || Component.name
    return Comp
  }

  const withContext = (Component, part) => {
    if (!part) return Component

    const Comp = forwardRef((props, ref) => {
      const styles = useContext(StyleContext)
      return <Component ref={ref} className={styles?.[part ?? '']} {...props} />
    })
    Comp.displayName = Component.displayName || Component.name
    return Comp
  }

  return { withProvider, withContext }
}
```

> Note: For the TypeScript version of this file, refer to [create-style-context.tsx](https://github.com/cschroeter/park-ui/blob/main/website/src/lib/create-style-context.tsx) in Park UI

Then, use the context to create compound components connected to the recipe

```jsx filename="Checkbox.tsx"
import { createStyleContext } from './style-context'
import { checkbox } from './checkbox.recipe'

const { withProvider, withContext } = createStyleContext(checkbox)

//                                  👇🏻 points to the root slot
const Root = withProvider('label', 'root')
//                                    👇🏻 points to the control slot
const Control = withContext('div', 'control')
//                                  👇🏻 points to the label slot
const Label = withContext('span', 'label')

const Checkbox = { Root, Control, Label }
```

## Config Slot Recipe

Config slot recipes are very similar atomic recipes except that they use well-defined classNames and store the styles in the `recipes` cascade layer.

The config slot recipe takes the following additional properties:

- `className`: The name of the recipe. Used in the generated class name
- `jsx`: An array of JSX components that use the recipe. Defaults to the uppercase version of the recipe name
- `description`: An optional description of the recipe (used in the js-doc comments)

### Defining the recipe

To define a config slot recipe, import the `defineSlotRecipe` function

```jsx filename="checkbox.recipe.ts"
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

### Adding recipe to config

To add the recipe to the config, you’d need to add it to the `slotRecipes` property of the `theme`

```jsx filename="panda.config.ts"
import { defineConfig } from '@pandacss/dev'
import { checkboxRecipe } from './checkbox.recipe'

export default defineConfig({
  //...
  jsxFramework: 'react',
  theme: {
    extend: {
      slotRecipes: {
        checkbox: checkboxRecipe
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
import { css } from '../styled-system/css'
import { checkbox } from '../styled-system/recipes'

const Checkbox = () => {
  const classes = checkbox({ size: 'sm' })
  return (
    <label className={classes.root}>
      <input type="checkbox" className={css({ srOnly: true })} />
      <div className={classes.control} />
      <span className={classes.label}>Checkbox Label</span>
    </label>
  )
}
```

The generated css is registered under the `recipe` [cascade layer](/docs/concepts/cascade-layers.mdx) with the class name that matches the recipe-slot-variant name pattern `<recipe-className>__<slot-name>--<variant-name>`.

```css
@layer recipes {
  @layer base {
    .checkbox__root {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .checkbox__control {
      border-width: var(--border-widths-1px);
      border-radius: var(--radii-sm);
    }

    .checkbox__label {
      margin-start: var(--space-2);
    }
  }

  .checkbox__control--size-sm {
    width: var(--space-8);
    height: var(--space-8);
  }

  .checkbox__label--size-sm {
    font-size: var(--font-sizes-sm);
  }

  .checkbox__control--size-md {
    width: var(--space-10);
    height: var(--space-10);
  }

  .checkbox__label--size-md {
    font-size: var(--font-sizes-md);
  }
}
```

### TypeScript Guide

Every slot recipe ships a type interface for its accepted variants. You can import them from the `styled-system/recipes` entrypoint.

For the checkbox recipe, we can import the `CheckboxVariants` type like so:

```ts
import React from 'react'
import type { CheckboxVariants } from '../styled-system/recipes'

type CheckboxProps = CheckboxVariants & {
  children: React.ReactNode
  value?: string
  onChange?: (value: string) => void
}
```
