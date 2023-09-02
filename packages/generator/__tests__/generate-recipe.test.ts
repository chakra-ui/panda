import { describe, expect, test } from 'vitest'
import { generateRecipes } from '../src/artifacts/js/recipe'
import { generator } from './fixture'

describe('generate recipes', () => {
  test('should ', () => {
    expect(generateRecipes(generator)).toMatchInlineSnapshot(`
      [
        {
          "dts": "",
          "js": "import { css } from '../css/css.mjs';
      import { assertCompoundVariant, getCompoundVariantCss } from '../css/cva.mjs';
      import { cx } from '../css/cx.mjs';
      import { compact, createCss, withoutSpace } from '../helpers.mjs';

      export const createRecipe = (name, defaultVariants, compoundVariants) => {
        return (variants) => {
         const transform = (prop, value) => {
           assertCompoundVariant(name, compoundVariants, variants, prop)

            if (value === '__ignore__') {
              return { className: name }
            }

            value = withoutSpace(value)
            return { className: \`\${name}--\${prop}_\${value}\` }
         }

         const recipeCss = createCss({
           
           utility: {
             
             transform,
           }
         })

         const recipeStyles = {
           [name]: '__ignore__',
           ...defaultVariants,
           ...compact(variants),
         }

         const compoundVariantStyles = getCompoundVariantCss(compoundVariants, recipeStyles)

         return cx(recipeCss(recipeStyles), css(compoundVariantStyles))
        }
      }",
          "name": "create-recipe",
        },
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { Pretty } from '../types/helpers';
      import type { DistributiveOmit } from '../types/system-types';

      type TextStyleVariant = {
        size: \\"h1\\" | \\"h2\\"
      }

      type TextStyleVariantMap = {
        [key in keyof TextStyleVariant]: Array<TextStyleVariant[key]>
      }

      export type TextStyleVariantProps = {
        [key in keyof TextStyleVariant]?: ConditionalValue<TextStyleVariant[key]>
      }

      interface TextStyleRecipe {
        __type: TextStyleVariantProps
        (props?: TextStyleVariantProps): string
        raw: (props?: TextStyleVariantProps) => TextStyleVariantProps
        variantMap: TextStyleVariantMap
        variantKeys: Array<keyof TextStyleVariant>
        splitVariantProps<Props extends TextStyleVariantProps>(props: Props): [TextStyleVariantProps, Pretty<DistributiveOmit<Props, keyof TextStyleVariantProps>>]
      }


      export declare const textStyle: TextStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe } from './create-recipe.mjs';

      const textStyleFn = createRecipe('textStyle', {}, [])

      const textStyleVariantMap = {
        \\"size\\": [
          \\"h1\\",
          \\"h2\\"
        ]
      }
      const textStyleVariantKeys = Object.keys(textStyleVariantMap)
      export const textStyle = Object.assign(textStyleFn, {
        __recipe__: true,
        raw: (props) => props,
        variantKeys: textStyleVariantKeys,
        variantMap: textStyleVariantMap,
        splitVariantProps(props) {
          return splitProps(props, textStyleVariantKeys)
        },
      })",
          "name": "text-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { Pretty } from '../types/helpers';
      import type { DistributiveOmit } from '../types/system-types';

      type TooltipStyleVariant = {
        
      }

      type TooltipStyleVariantMap = {
        [key in keyof TooltipStyleVariant]: Array<TooltipStyleVariant[key]>
      }

      export type TooltipStyleVariantProps = {
        [key in keyof TooltipStyleVariant]?: ConditionalValue<TooltipStyleVariant[key]>
      }

      interface TooltipStyleRecipe {
        __type: TooltipStyleVariantProps
        (props?: TooltipStyleVariantProps): string
        raw: (props?: TooltipStyleVariantProps) => TooltipStyleVariantProps
        variantMap: TooltipStyleVariantMap
        variantKeys: Array<keyof TooltipStyleVariant>
        splitVariantProps<Props extends TooltipStyleVariantProps>(props: Props): [TooltipStyleVariantProps, Pretty<DistributiveOmit<Props, keyof TooltipStyleVariantProps>>]
      }


      export declare const tooltipStyle: TooltipStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe } from './create-recipe.mjs';

      const tooltipStyleFn = createRecipe('tooltipStyle', {}, [])

      const tooltipStyleVariantMap = {}
      const tooltipStyleVariantKeys = Object.keys(tooltipStyleVariantMap)
      export const tooltipStyle = Object.assign(tooltipStyleFn, {
        __recipe__: true,
        raw: (props) => props,
        variantKeys: tooltipStyleVariantKeys,
        variantMap: tooltipStyleVariantMap,
        splitVariantProps(props) {
          return splitProps(props, tooltipStyleVariantKeys)
        },
      })",
          "name": "tooltip-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types/index';
      import type { Pretty } from '../types/helpers';
      import type { DistributiveOmit } from '../types/system-types';

      type ButtonStyleVariant = {
        size: \\"sm\\" | \\"md\\"
      variant: \\"solid\\" | \\"outline\\"
      }

      type ButtonStyleVariantMap = {
        [key in keyof ButtonStyleVariant]: Array<ButtonStyleVariant[key]>
      }

      export type ButtonStyleVariantProps = {
        [key in keyof ButtonStyleVariant]?: ConditionalValue<ButtonStyleVariant[key]>
      }

      interface ButtonStyleRecipe {
        __type: ButtonStyleVariantProps
        (props?: ButtonStyleVariantProps): string
        raw: (props?: ButtonStyleVariantProps) => ButtonStyleVariantProps
        variantMap: ButtonStyleVariantMap
        variantKeys: Array<keyof ButtonStyleVariant>
        splitVariantProps<Props extends ButtonStyleVariantProps>(props: Props): [ButtonStyleVariantProps, Pretty<DistributiveOmit<Props, keyof ButtonStyleVariantProps>>]
      }


      export declare const buttonStyle: ButtonStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe } from './create-recipe.mjs';

      const buttonStyleFn = createRecipe('buttonStyle', {
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
      export const buttonStyle = Object.assign(buttonStyleFn, {
        __recipe__: true,
        raw: (props) => props,
        variantKeys: buttonStyleVariantKeys,
        variantMap: buttonStyleVariantMap,
        splitVariantProps(props) {
          return splitProps(props, buttonStyleVariantKeys)
        },
      })",
          "name": "button-style",
        },
      ]
    `)
  })
})
