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

      type TextStyleVariant = {
        size: \\"h1\\" | \\"h2\\"
      }

      type TextStyleVariantMap = {
        [key in keyof TextStyleVariant]: Array<TextStyleVariant[key]>
      }

      export type TextStyleVariants = {
        [key in keyof TextStyleVariant]?: ConditionalValue<TextStyleVariant[key]>
      }


      export declare function textStyle(variants?: TextStyleVariants): string & {
        variants: TextStyleVariantMap
      }",
          "js": "import { createRecipe } from './create-recipe.mjs';

      export const textStyle = createRecipe('textStyle', {}, [])
      textStyle.variants = {\\"size\\":[\\"h1\\",\\"h2\\"]}",
          "name": "text-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types'

      type TooltipStyleVariant = {
        
      }

      type TooltipStyleVariantMap = {
        [key in keyof TooltipStyleVariant]: Array<TooltipStyleVariant[key]>
      }

      export type TooltipStyleVariants = {
        [key in keyof TooltipStyleVariant]?: ConditionalValue<TooltipStyleVariant[key]>
      }


      export declare function tooltipStyle(variants?: TooltipStyleVariants): string & {
        variants: TooltipStyleVariantMap
      }",
          "js": "import { createRecipe } from './create-recipe.mjs';

      export const tooltipStyle = createRecipe('tooltipStyle', {}, [])
      tooltipStyle.variants = {}",
          "name": "tooltip-style",
        },
        {
          "dts": "import type { ConditionalValue } from '../types'

      type ButtonStyleVariant = {
        size: \\"sm\\" | \\"md\\"
      variant: \\"solid\\" | \\"outline\\"
      }

      type ButtonStyleVariantMap = {
        [key in keyof ButtonStyleVariant]: Array<ButtonStyleVariant[key]>
      }

      export type ButtonStyleVariants = {
        [key in keyof ButtonStyleVariant]?: ConditionalValue<ButtonStyleVariant[key]>
      }


      export declare function buttonStyle(variants?: ButtonStyleVariants): string & {
        variants: ButtonStyleVariantMap
      }",
          "js": "import { createRecipe } from './create-recipe.mjs';

      export const buttonStyle = createRecipe('buttonStyle', {\\"size\\":\\"md\\",\\"variant\\":\\"solid\\"}, [])
      buttonStyle.variants = {\\"size\\":[\\"sm\\",\\"md\\"],\\"variant\\":[\\"solid\\",\\"outline\\"]}",
          "name": "button-style",
        },
      ]
    `)
  })
})
