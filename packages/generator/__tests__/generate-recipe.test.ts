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
           hash: false,
           utility: {
             prefix: undefined,
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
          "dts": "import type { ConditionalValue } from '../types'
      import type { Pretty } from '../types/helpers'

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
        (variants?: TextStyleVariants): string
        variants: TextStyleVariantMap
        splitVariantProps<Props extends TextStyleVariantProps>(props: Props): [TextStyleVariantProps, Pretty<Omit<Props, keyof TextStyleVariantProps>>]
      }


      export declare const textStyle: TextStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe } from './create-recipe.mjs';

      export const textStyle = createRecipe('textStyle', {}, [])

      textStyle.variants = {
        \\"size\\": [
          \\"h1\\",
          \\"h2\\"
        ]
      }

      const variantKeys = [
        \\"size\\"
      ]
      textStyle.splitVariantProps = (props) => splitProps(props, variantKeys)",
          "name": "text-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types'
      import type { Pretty } from '../types/helpers'

      type TooltipStyleVariant = {
        
      }

      type TooltipStyleVariantMap = {
        [key in keyof TooltipStyleVariant]: Array<TooltipStyleVariant[key]>
      }

      export type TooltipStyleVariantProps = {
        [key in keyof TooltipStyleVariant]?: ConditionalValue<TooltipStyleVariant[key]>
      }

      interface TooltipStyleRecipe {
        (variants?: TooltipStyleVariants): string
        variants: TooltipStyleVariantMap
        splitVariantProps<Props extends TooltipStyleVariantProps>(props: Props): [TooltipStyleVariantProps, Pretty<Omit<Props, keyof TooltipStyleVariantProps>>]
      }


      export declare const tooltipStyle: TooltipStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe } from './create-recipe.mjs';

      export const tooltipStyle = createRecipe('tooltipStyle', {}, [])

      tooltipStyle.variants = {}

      const variantKeys = []
      tooltipStyle.splitVariantProps = (props) => splitProps(props, variantKeys)",
          "name": "tooltip-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types'
      import type { Pretty } from '../types/helpers'

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
        (variants?: ButtonStyleVariants): string
        variants: ButtonStyleVariantMap
        splitVariantProps<Props extends ButtonStyleVariantProps>(props: Props): [ButtonStyleVariantProps, Pretty<Omit<Props, keyof ButtonStyleVariantProps>>]
      }


      export declare const buttonStyle: ButtonStyleRecipe",
          "js": "import { splitProps } from '../helpers.mjs';
      import { createRecipe } from './create-recipe.mjs';

      export const buttonStyle = createRecipe('buttonStyle', {
        \\"size\\": \\"md\\",
        \\"variant\\": \\"solid\\"
      }, [])

      buttonStyle.variants = {
        \\"size\\": [
          \\"sm\\",
          \\"md\\"
        ],
        \\"variant\\": [
          \\"solid\\",
          \\"outline\\"
        ]
      }

      const variantKeys = [
        \\"size\\",
        \\"variant\\"
      ]
      buttonStyle.splitVariantProps = (props) => splitProps(props, variantKeys)",
          "name": "button-style",
        },
      ]
    `)
  })
})
