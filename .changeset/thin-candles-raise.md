---
'@pandacss/generator': patch
'@pandacss/studio': patch
'@pandacss/types': patch
'@pandacss/dev': patch
---

# Add support for Config Recipe (and Slot) extensions

You can now extend config Recipes and config Slots Recipes to easily compose them together.

## Added

New `defineRecipeConfigs` identity function that takes an object of `RecipeConfig` objects (or the new `RecipeBuilder`
interface !) and returns the same object with less strict typing. This can be useful to help Typescript checking
performance when using a large number of recipes or when using complex recipes, with a large number of variants and/or a
large number of styles.

## Changed

### Config Recipe

The `defineRecipe` method will now return a `RecipeBuilder` object instead of a `RecipeConfig` object. The
`RecipeBuilder` object has the following methods:

- `extend`: add additional variants to or override variants of a recipe.

```ts
const button = defineRecipe({
  className: 'btn',
  variants: {
    variant: { primary: { color: 'red' }, }
  },
}).config.extend({
  variant: (
    primary: { px: 2 },
    secondary: { color: 'blue' },
  )
})
```

resulting in:

```json
{
  "className": "btn",
  "variants": {
    "variant": {
      "primary": { "color": "red", "px": 2 },
      "secondary": { "color": "blue" }
    }
  }
}
```

- `merge`: deep merge a recipe with another recipe. It takes a partial `RecipeConfig` object as an argument, which can
  include new (or existing) variants, compound variants, and default variants.

```ts
const button = defineRecipe({
  className: 'btn',
  variants: {
    variant: { primary: { color: 'red' } },
  },
}).config.merge({
  className: 'custom-btn',
  variants: {
    secondary: { color: 'blue' },
  },
  defaultVariants: {
    variant: 'secondary',
  },
})
```

resulting in:

```json
{
  "className": "custom-btn",
  "variants": {
    "variant": {
      "primary": { "color": "red" },
      "secondary": { "color": "blue" }
    }
  },
  "defaultVariants": {
    "variant": "secondary"
  }
}
```

- `pick`: pick only specified variants from a recipe. It takes a list of variant keys as arguments and returns a new
  `RecipeBuilder` object with only the specified variants. This will also filter out any compound variants that include
  any of the omitted variants.

```ts
const button = defineRecipe({
  className: 'btn',
  variants: {
    variant: { primary: { color: 'red' } },
    size: { small: { px: 2 }, large: { px: 4 } },
  },
}).config.pick('size')
```

resulting in:

```json
{
  "className": "btn",
  "variants": {
    "variant": {
      "size": {
        "small": { "px": 2 },
        "large": { "px": 4 }
      }
    }
  }
}
```

- `omit`: omit specified variants from a recipe. It takes a list of variant keys as arguments and returns a new
  `RecipeBuilder` object without the specified variants. This will also filter out any compound variants that include
  any of the omitted variants.

```ts
const button = defineRecipe({
  className: 'btn',
  variants: {
    variant: { primary: { color: 'red' } },
    size: { small: { px: 2 }, large: { px: 4 } },
  },
}).config.omit('size')
```

resulting in:

```json
{
  "className": "btn",
  "variants": {
    "variant": {
      "primary": { "color": "red" }
    }
  }
}
```

- `cast`: make the recipe generic to simplify the typings. It returns a new `RecipeConfig` object with the final
  computed variants, without the `RecipeBuilder` methods.

Each of these methods return a new `RecipeBuilder` object, so they can be chained together.

### Config Slot Recipe

The `defineSlotRecipe` method will now return a `SlotRecipeBuilder` object instead of a `SlotRecipeConfig` object. The
`SlotRecipeBuilder` object has the same following methods as the `RecipeBuilder` object: `extend`, `merge`, `pick`, and
`omit`.

In addition, the `SlotRecipeBuilder` object has an object property called `slots` that is a `SlotRecipeBuilder`, which
has the following methods:

- `add`: add additional slots to a slot recipe. It takes a list of slot names as arguments and returns a new
  `SlotRecipeBuilder` object with the updated slots.

```ts
const card = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'input', 'icon'],
  variants: {
    variant: {
      subtle: { root: { color: 'blue.100' } },
      solid: { root: { color: 'blue.100' } },
    },
    size: {
      sm: { root: { fontSize: 'sm' } },
      md: { root: { fontSize: 'md' } },
    },
  },
}).config.slots.add('label')
```

resulting in:

```json
{
  "className": "card",
  "slots": ["root", "input", "icon", "label"],
  "variants": {
    "variant": {
      "subtle": { "root": { "color": "blue.100" } },
      "solid": { "root": { "color": "blue.100" } }
    },
    "size": {
      "sm": { "root": { "fontSize": "sm" } },
      "md": { "root": { "fontSize": "md" } }
    }
  }
}
```

- `pick`: pick only specified slots from a slot recipe. It takes a list of slot keys as arguments and returns a new
  `SlotRecipeBuilder` object with only the specified slots. This will also filter out any styles defined in a slot that
  is not picked, as well as any compound variants that include any of the omitted slots.

```ts
const card = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'input', 'icon'],
  variants: {
    variant: {
      subtle: { root: { color: 'blue.100' } },
      solid: { input: { color: 'blue.100' } },
    },
    size: {
      sm: { root: { fontSize: 'sm' } },
      md: { input: { fontSize: 'md' } },
    },
  },
}).config.slots.pick('input')
```

resulting in:

```json
{
  "className": "card",
  "slots": ["input"],
  "variants": {
    "variant": {
      "solid": { "input": { "color": "blue.100" } }
    },
    "size": {
      "md": { "input": { "fontSize": "md" } }
    }
  }
}
```

- `omit`: omit specified slots from a slot recipe. It takes a list of slot keys as arguments and returns a new
  `SlotRecipeBuilder` object without the specified slots. This will also filter out any styles defined in a slot that is
  not picked, as well as any compound variants that include any of the omitted slots.

```ts
const card = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'input', 'icon'],
  variants: {
    variant: {
      subtle: { root: { color: 'blue.100' } },
      solid: { input: { color: 'blue.100' } },
    },
    size: {
      sm: { root: { fontSize: 'sm' } },
      md: { input: { fontSize: 'md' } },
    },
  },
}).config.slots.omit('input')
```

resulting in:

```json
{
  "className": "card",
  "slots": ["root", "icon"],
  "variants": {
    "variant": {
      "subtle": { "root": { "color": "blue.100" } }
    },
    "size": {
      "sm": { "root": { "fontSize": "sm" } }
    }
  }
}
```

- `assignTo`: assign a simple (without slots) recipe to a slot of the current slot recipe. It takes a slot name and a
  recipe config as arguments and returns a new `SlotRecipeBuilder` object with the updated slot recipe. If a slot name
  already has styles defined in a matching (both defined in the simple recipe to assign from and the current slot recipe
  being assigned to) variant, the styles will be merged with the existing slot recipe, with priority given to the styles
  defined in the simple recipe to assign from.

```ts
const button = defineRecipe({
  className: 'btn',
  variants: {
    variant: {
      outline: { color: 'green.100' },
      empty: { border: 'none' },
    },
    size: {
      lg: { fontSize: 'xl', h: '10' },
    },
  },
})

const card = defineSlotRecipe({
  className: 'card',
  slots: ['root', 'input', 'icon'],
  variants: {
    variant: {
      subtle: { root: { color: 'blue.100' } },
      solid: { input: { color: 'blue.100' } },
      outline: { input: { mx: 2 } },
      empty: { input: {} },
    },
    size: {
      sm: { root: { fontSize: 'sm' } },
      md: { input: { fontSize: 'md' } },
    },
  },
}).config.slots.assignTo('input', button)
```

resulting in:

```json
{
  "className": "card",
  "slots": ["root", "input", "icon"],
  "variants": {
    "variant": {
      "subtle": { "root": { "color": "blue.100" } },
      "solid": { "input": { "color": "blue.100" } },
      "outline": { "input": { "mx": 2, "color": "green.100" } },
      "empty": { "input": {} }
    },
    "size": {
      "sm": { "root": { "fontSize": "sm" } },
      "md": { "input": { "fontSize": "md" } }
    }
  }
}
```
