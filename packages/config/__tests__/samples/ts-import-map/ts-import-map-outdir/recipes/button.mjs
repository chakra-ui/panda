import { splitProps } from '../helpers.mjs';
import { createRecipe } from './create-recipe.mjs';

const buttonFn = createRecipe('button', {}, [])

const buttonVariantMap = {
  "visual": [
    "solid",
    "outline"
  ]
}
const buttonVariantKeys = Object.keys(buttonVariantMap)
export const button = Object.assign(buttonFn, {
  __recipe__: true,
  raw: (props) => props,
  variantKeys: buttonVariantKeys,
  variantMap: buttonVariantMap,
  splitVariantProps(props) {
    return splitProps(props, buttonVariantKeys)
  },
})