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

- `merge`: deep merge a recipe with another recipe. It takes a partial `RecipeConfig` object as an argument, which can
  include new (or existing) variants, compound variants, and default variants.

- `pick`: pick only specified variants from a recipe. It takes a list of variant keys as arguments and returns a new
  `RecipeBuilder` object with only the specified variants. This will also filter out any compound variants that include
  any of the omitted variants.

- `omit`: omit specified variants from a recipe. It takes a list of variant keys as arguments and returns a new
  `RecipeBuilder` object without the specified variants. This will also filter out any compound variants that include
  any of the omitted variants.

- `cast`: make the recipe generic to simplify the typings. It returns a new `RecipeConfig` object with the final
  computed variants.

Each of these methods return a new `RecipeBuilder` object, so they can be chained together.

### Config Slot Recipe

The `defineSlotRecipe` method will now return a `SlotRecipeBuilder` object instead of a `SlotRecipeConfig` object. The
`SlotRecipeBuilder` object has the same following methods as the `RecipeBuilder` object: `extend`, `merge`, `pick`, and
`omit`.

In addition, the `SlotRecipeBuilder` object has an object property called `slots` that is a `SlotRecipeBuilder`, which
has the following methods:

- `add`: add additional slots to a slot recipe. It takes a list of slot names as arguments and returns a new
  `SlotRecipeBuilder` object with the updated slots.

- `pick`: pick only specified slots from a slot recipe. It takes a list of slot keys as arguments and returns a new
  `SlotRecipeBuilder` object with only the specified slots. This will also filter out any styles defined in a slot that
  is not picked, as well as any compound variants that include any of the omitted slots.

- `omit`: omit specified slots from a slot recipe. It takes a list of slot keys as arguments and returns a new
  `SlotRecipeBuilder` object without the specified slots. This will also filter out any styles defined in a slot that is
  not picked, as well as any compound variants that include any of the omitted slots.

- `assignTo`: assign a simple (without slots) recipe to a slot of the current slot recipe. It takes a slot name and a
  recipe config as arguments and returns a new `SlotRecipeBuilder` object with the updated slot recipe. If a slot name
  already has styles defined in a matching (both defined in the simple recipe to assign from and the current slot recipe
  being assigned to) variant, the styles will be merged with the existing slot recipe, with priority given to the styles
  defined in the simple recipe to assign from.
