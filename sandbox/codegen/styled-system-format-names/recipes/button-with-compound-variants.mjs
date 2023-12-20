import { splitProps } from '../helpers.mjs';
import { createRecipe, mergeRecipes } from './create-recipe.mjs';

const buttonWithCompoundVariantsFn = /* @__PURE__ */ createRecipe('button', {}, [
  {
    "visual": "solid",
    "css": {
      "color": "blue"
    }
  },
  {
    "size": "md",
    "visual": "outline",
    "css": {
      "color": "green"
    }
  },
  {
    "size": [
      "sm",
      "lg"
    ],
    "visual": "outline",
    "css": {
      "color": "red"
    }
  }
])

const buttonWithCompoundVariantsVariantMap = {
  "visual": [
    "solid",
    "outline"
  ],
  "size": [
    "sm",
    "md",
    "lg"
  ]
}

const buttonWithCompoundVariantsVariantKeys = Object.keys(buttonWithCompoundVariantsVariantMap)

export const buttonWithCompoundVariants = /* @__PURE__ */ Object.assign(buttonWithCompoundVariantsFn, {
  __recipe__: true,
  __name__: 'buttonWithCompoundVariants',
  raw: (props) => props,
  variantKeys: buttonWithCompoundVariantsVariantKeys,
  variantMap: buttonWithCompoundVariantsVariantMap,
  merge(recipe) {
    return mergeRecipes(this, recipe)
  },
  splitVariantProps(props) {
    return splitProps(props, buttonWithCompoundVariantsVariantKeys)
  },
})