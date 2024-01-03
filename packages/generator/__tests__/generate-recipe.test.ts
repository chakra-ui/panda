import type { ConfigResultWithHooks } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { Generator } from '../src'
import { generateCreateRecipe, generateRecipes } from '../src/artifacts/js/recipe'
import { fixtureDefaults } from '@pandacss/fixture'

const createRecipeJs = (config: ConfigResultWithHooks) => {
  const generator = new Generator(config)
  return generateCreateRecipe(generator)
}

const recipeJs = (config: ConfigResultWithHooks) => {
  const generator = new Generator(config)
  return generateRecipes(generator)
}

describe('generate recipes', () => {
  test('should ', () => {
    expect(createRecipeJs(fixtureDefaults)).toMatchInlineSnapshot(`
      {
        "dts": "",
        "js": "import { finalizeConditions, sortConditions } from '../css/conditions.mjs';
      import { css } from '../css/css.mjs';
      import { assertCompoundVariant, getCompoundVariantCss } from '../css/cva.mjs';
      import { cx } from '../css/cx.mjs';
      import { compact, createCss, splitProps, uniq, withoutSpace } from '../helpers.mjs';

      export const createRecipe = (name, defaultVariants, compoundVariants) => {
       const getRecipeStyles = (variants) => {
         return {
           [name]: '__ignore__',
           ...defaultVariants,
           ...compact(variants),
         };
       };

        const recipeFn = (variants, withCompoundVariants = true) => {
         const transform = (prop, value) => {
           assertCompoundVariant(name, compoundVariants, variants, prop)

            if (value === '__ignore__') {
              return { className: name }
            }

            value = withoutSpace(value)
            return { className: \`\${name}--\${prop}_\${value}\` }
         }

         const recipeCss = createCss({
           
           conditions: {
             shift: sortConditions,
             finalize: finalizeConditions,
             breakpoints: { keys: [\\"base\\",\\"sm\\",\\"md\\",\\"lg\\",\\"xl\\",\\"2xl\\"] }
           },
           utility: {
             
             transform,
           }
         })

         const recipeStyles = getRecipeStyles(variants)

         if (withCompoundVariants) {
           const compoundVariantStyles = getCompoundVariantCss(compoundVariants, recipeStyles)
           return cx(recipeCss(recipeStyles), css(compoundVariantStyles))
         }

         return recipeCss(recipeStyles)
        }

         return Object.assign(recipeFn, {
           __getCompoundVariantCss__: (variants) => {
             return getCompoundVariantCss(compoundVariants, getRecipeStyles(variants));
           },
         })
      }

      export const mergeRecipes = (recipeA, recipeB) => {
       if (recipeA && !recipeB) return recipeA
       if (!recipeA && recipeB) return recipeB

       const recipeFn = (...args) => cx(recipeA(...args), recipeB(...args))
       const variantKeys = uniq(recipeA.variantKeys, recipeB.variantKeys)
       const variantMap = variantKeys.reduce((acc, key) => {
         acc[key] = uniq(recipeA.variantMap[key], recipeB.variantMap[key])
         return acc
       }, {})

       return Object.assign(recipeFn, {
         __recipe__: true,
         __name__: \`\${recipeA.__name__} \${recipeB.__name__}\`,
         raw: (props) => props,
         variantKeys,
         variantMap,
         splitVariantProps(props) {
           return splitProps(props, variantKeys)
         },
       })
       }
      ",
        "name": "create-recipe",
      }
    `)

    expect(recipeJs(fixtureDefaults)).toMatchInlineSnapshot(`
      [
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { DistributiveOmit, Pretty } from '../types/system-types';

      interface TextStyleVariant {
        size: \\"h1\\" | \\"h2\\"
      }

      type TextStyleVariantMap = {
        [key in keyof TextStyleVariant]: Array<TextStyleVariant[key]>
      }

      export type TextStyleVariantProps = {
        [key in keyof TextStyleVariant]?: ConditionalValue<TextStyleVariant[key]> | undefined
      }

      export interface TextStyleRecipe {
        __type: TextStyleVariantProps
        (props?: TextStyleVariantProps): string
        raw: (props?: TextStyleVariantProps) => TextStyleVariantProps
        variantMap: TextStyleVariantMap
        variantKeys: Array<keyof TextStyleVariant>
        splitVariantProps<Props extends TextStyleVariantProps>(props: Props): [TextStyleVariantProps, Pretty<DistributiveOmit<Props, keyof TextStyleVariantProps>>]
      }


      export declare const textStyle: TextStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe, mergeRecipes } from './create-recipe.mjs';

      const textStyleFn = /* @__PURE__ */ createRecipe('textStyle', {}, [])

      const textStyleVariantMap = {
        \\"size\\": [
          \\"h1\\",
          \\"h2\\"
        ]
      }

      const textStyleVariantKeys = Object.keys(textStyleVariantMap)

      export const textStyle = /* @__PURE__ */ Object.assign(textStyleFn, {
        __recipe__: true,
        __name__: 'textStyle',
        raw: (props) => props,
        variantKeys: textStyleVariantKeys,
        variantMap: textStyleVariantMap,
        merge(recipe) {
          return mergeRecipes(this, recipe)
        },
        splitVariantProps(props) {
          return splitProps(props, textStyleVariantKeys)
        },
      })",
          "name": "text-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { DistributiveOmit, Pretty } from '../types/system-types';

      interface TooltipStyleVariant {
        
      }

      type TooltipStyleVariantMap = {
        [key in keyof TooltipStyleVariant]: Array<TooltipStyleVariant[key]>
      }

      export type TooltipStyleVariantProps = {
        [key in keyof TooltipStyleVariant]?: ConditionalValue<TooltipStyleVariant[key]> | undefined
      }

      export interface TooltipStyleRecipe {
        __type: TooltipStyleVariantProps
        (props?: TooltipStyleVariantProps): string
        raw: (props?: TooltipStyleVariantProps) => TooltipStyleVariantProps
        variantMap: TooltipStyleVariantMap
        variantKeys: Array<keyof TooltipStyleVariant>
        splitVariantProps<Props extends TooltipStyleVariantProps>(props: Props): [TooltipStyleVariantProps, Pretty<DistributiveOmit<Props, keyof TooltipStyleVariantProps>>]
      }


      export declare const tooltipStyle: TooltipStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe, mergeRecipes } from './create-recipe.mjs';

      const tooltipStyleFn = /* @__PURE__ */ createRecipe('tooltipStyle', {}, [])

      const tooltipStyleVariantMap = {}

      const tooltipStyleVariantKeys = Object.keys(tooltipStyleVariantMap)

      export const tooltipStyle = /* @__PURE__ */ Object.assign(tooltipStyleFn, {
        __recipe__: true,
        __name__: 'tooltipStyle',
        raw: (props) => props,
        variantKeys: tooltipStyleVariantKeys,
        variantMap: tooltipStyleVariantMap,
        merge(recipe) {
          return mergeRecipes(this, recipe)
        },
        splitVariantProps(props) {
          return splitProps(props, tooltipStyleVariantKeys)
        },
      })",
          "name": "tooltip-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { DistributiveOmit, Pretty } from '../types/system-types';

      interface CardStyleVariant {
        rounded: boolean
      }

      type CardStyleVariantMap = {
        [key in keyof CardStyleVariant]: Array<CardStyleVariant[key]>
      }

      export type CardStyleVariantProps = {
        [key in keyof CardStyleVariant]?: ConditionalValue<CardStyleVariant[key]> | undefined
      }

      export interface CardStyleRecipe {
        __type: CardStyleVariantProps
        (props?: CardStyleVariantProps): string
        raw: (props?: CardStyleVariantProps) => CardStyleVariantProps
        variantMap: CardStyleVariantMap
        variantKeys: Array<keyof CardStyleVariant>
        splitVariantProps<Props extends CardStyleVariantProps>(props: Props): [CardStyleVariantProps, Pretty<DistributiveOmit<Props, keyof CardStyleVariantProps>>]
      }


      export declare const cardStyle: CardStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe, mergeRecipes } from './create-recipe.mjs';

      const cardStyleFn = /* @__PURE__ */ createRecipe('card', {}, [])

      const cardStyleVariantMap = {
        \\"rounded\\": [
          \\"true\\"
        ]
      }

      const cardStyleVariantKeys = Object.keys(cardStyleVariantMap)

      export const cardStyle = /* @__PURE__ */ Object.assign(cardStyleFn, {
        __recipe__: true,
        __name__: 'cardStyle',
        raw: (props) => props,
        variantKeys: cardStyleVariantKeys,
        variantMap: cardStyleVariantMap,
        merge(recipe) {
          return mergeRecipes(this, recipe)
        },
        splitVariantProps(props) {
          return splitProps(props, cardStyleVariantKeys)
        },
      })",
          "name": "card-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { DistributiveOmit, Pretty } from '../types/system-types';

      interface ButtonStyleVariant {
        size: \\"sm\\" | \\"md\\"
      variant: \\"solid\\" | \\"outline\\"
      }

      type ButtonStyleVariantMap = {
        [key in keyof ButtonStyleVariant]: Array<ButtonStyleVariant[key]>
      }

      export type ButtonStyleVariantProps = {
        [key in keyof ButtonStyleVariant]?: ConditionalValue<ButtonStyleVariant[key]> | undefined
      }

      export interface ButtonStyleRecipe {
        __type: ButtonStyleVariantProps
        (props?: ButtonStyleVariantProps): string
        raw: (props?: ButtonStyleVariantProps) => ButtonStyleVariantProps
        variantMap: ButtonStyleVariantMap
        variantKeys: Array<keyof ButtonStyleVariant>
        splitVariantProps<Props extends ButtonStyleVariantProps>(props: Props): [ButtonStyleVariantProps, Pretty<DistributiveOmit<Props, keyof ButtonStyleVariantProps>>]
      }


      export declare const buttonStyle: ButtonStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe, mergeRecipes } from './create-recipe.mjs';

      const buttonStyleFn = /* @__PURE__ */ createRecipe('buttonStyle', {
        \\"size\\": \\"md\\",
        \\"variant\\": \\"solid\\"
      }, [])

      const buttonStyleVariantMap = {
        \\"size\\": [
          \\"sm\\",
          \\"md\\"
        ],
        \\"variant\\": [
          \\"solid\\",
          \\"outline\\"
        ]
      }

      const buttonStyleVariantKeys = Object.keys(buttonStyleVariantMap)

      export const buttonStyle = /* @__PURE__ */ Object.assign(buttonStyleFn, {
        __recipe__: true,
        __name__: 'buttonStyle',
        raw: (props) => props,
        variantKeys: buttonStyleVariantKeys,
        variantMap: buttonStyleVariantMap,
        merge(recipe) {
          return mergeRecipes(this, recipe)
        },
        splitVariantProps(props) {
          return splitProps(props, buttonStyleVariantKeys)
        },
      })",
          "name": "button-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { DistributiveOmit, Pretty } from '../types/system-types';

      interface CheckboxVariant {
        size: \\"sm\\" | \\"md\\" | \\"lg\\"
      }

      type CheckboxVariantMap = {
        [key in keyof CheckboxVariant]: Array<CheckboxVariant[key]>
      }

      export type CheckboxVariantProps = {
        [key in keyof CheckboxVariant]?: ConditionalValue<CheckboxVariant[key]> | undefined
      }

      export interface CheckboxRecipe {
        __type: CheckboxVariantProps
        (props?: CheckboxVariantProps): Pretty<Record<\\"root\\" | \\"control\\" | \\"label\\", string>>
        raw: (props?: CheckboxVariantProps) => CheckboxVariantProps
        variantMap: CheckboxVariantMap
        variantKeys: Array<keyof CheckboxVariant>
        splitVariantProps<Props extends CheckboxVariantProps>(props: Props): [CheckboxVariantProps, Pretty<DistributiveOmit<Props, keyof CheckboxVariantProps>>]
      }


      export declare const checkbox: CheckboxRecipe",
          "js": "import { splitProps, getSlotCompoundVariant } from '../helpers.mjs';
      import { createRecipe } from './create-recipe.mjs';

      const checkboxDefaultVariants = {
        \\"size\\": \\"sm\\"
      }
      const checkboxCompoundVariants = []

      const checkboxSlotNames = [
        [
          \\"root\\",
          \\"checkbox__root\\"
        ],
        [
          \\"control\\",
          \\"checkbox__control\\"
        ],
        [
          \\"label\\",
          \\"checkbox__label\\"
        ]
      ]
      const checkboxSlotFns = /* @__PURE__ */ checkboxSlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, checkboxDefaultVariants, getSlotCompoundVariant(checkboxCompoundVariants, slotName))])

      const checkboxFn = (props = {}) => {
        return Object.fromEntries(checkboxSlotFns.map(([slotName, slotFn]) => [slotName, slotFn(props)]))
      }

      const checkboxVariantKeys = [
        \\"size\\"
      ]

      export const checkbox = /* @__PURE__ */ Object.assign(checkboxFn, {
        __recipe__: false,
        __name__: 'checkbox',
        raw: (props) => props,
        variantKeys: checkboxVariantKeys,
        variantMap: {
        \\"size\\": [
          \\"sm\\",
          \\"md\\",
          \\"lg\\"
        ]
      },
        splitVariantProps(props) {
          return splitProps(props, checkboxVariantKeys)
        },
      })",
          "name": "checkbox",
        },
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { DistributiveOmit, Pretty } from '../types/system-types';

      interface BadgeVariant {
        size: \\"sm\\"
      raised: boolean
      }

      type BadgeVariantMap = {
        [key in keyof BadgeVariant]: Array<BadgeVariant[key]>
      }

      export type BadgeVariantProps = {
        [key in keyof BadgeVariant]?: BadgeVariant[key] | undefined
      }

      export interface BadgeRecipe {
        __type: BadgeVariantProps
        (props?: BadgeVariantProps): Pretty<Record<\\"title\\" | \\"body\\", string>>
        raw: (props?: BadgeVariantProps) => BadgeVariantProps
        variantMap: BadgeVariantMap
        variantKeys: Array<keyof BadgeVariant>
        splitVariantProps<Props extends BadgeVariantProps>(props: Props): [BadgeVariantProps, Pretty<DistributiveOmit<Props, keyof BadgeVariantProps>>]
      }


      export declare const badge: BadgeRecipe",
          "js": "import { splitProps, getSlotCompoundVariant } from '../helpers.mjs';
      import { createRecipe } from './create-recipe.mjs';

      const badgeDefaultVariants = {}
      const badgeCompoundVariants = [
        {
          \\"raised\\": true,
          \\"size\\": \\"sm\\",
          \\"css\\": {
            \\"title\\": {
              \\"color\\": \\"ButtonHighlight\\"
            }
          }
        }
      ]

      const badgeSlotNames = [
        [
          \\"title\\",
          \\"badge__title\\"
        ],
        [
          \\"body\\",
          \\"badge__body\\"
        ]
      ]
      const badgeSlotFns = /* @__PURE__ */ badgeSlotNames.map(([slotName, slotKey]) => [slotName, createRecipe(slotKey, badgeDefaultVariants, getSlotCompoundVariant(badgeCompoundVariants, slotName))])

      const badgeFn = (props = {}) => {
        return Object.fromEntries(badgeSlotFns.map(([slotName, slotFn]) => [slotName, slotFn(props)]))
      }

      const badgeVariantKeys = [
        \\"size\\",
        \\"raised\\"
      ]

      export const badge = /* @__PURE__ */ Object.assign(badgeFn, {
        __recipe__: false,
        __name__: 'badge',
        raw: (props) => props,
        variantKeys: badgeVariantKeys,
        variantMap: {
        \\"size\\": [
          \\"sm\\"
        ],
        \\"raised\\": [
          \\"true\\"
        ]
      },
        splitVariantProps(props) {
          return splitProps(props, badgeVariantKeys)
        },
      })",
          "name": "badge",
        },
      ]
    `)
  })
})
