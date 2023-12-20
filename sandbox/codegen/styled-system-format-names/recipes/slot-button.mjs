import { splitProps, getSlotCompoundVariant } from '../helpers.mjs';
import { createRecipe } from './create-recipe.mjs';


const slotButtonDefaultVariants = {}
const slotButtonCompoundVariants = []

const slotButtonSlotNames = [
  [
    "root",
    "slot-button__root"
  ],
  [
    "icon",
    "slot-button__icon"
  ]
]
const slotButtonSlotFns = /* @__PURE__ */ slotButtonSlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, slotButtonDefaultVariants, getSlotCompoundVariant(slotButtonCompoundVariants, slotName))])

const slotButtonFn = (props = {}) => {
  return Object.fromEntries(slotButtonSlotFns.map(([slotName, slotFn]) => [slotName, slotFn(props)]))
}

const slotButtonVariantKeys = [
  "visual"
]

export const slotButton = /* @__PURE__ */ Object.assign(slotButtonFn, {
  __recipe__: false,
  __name__: 'slotButton',
  raw: (props) => props,
  variantKeys: slotButtonVariantKeys,
  variantMap: {
  "visual": [
    "solid",
    "outline"
  ]
},
  splitVariantProps(props) {
    return splitProps(props, slotButtonVariantKeys)
  },
})