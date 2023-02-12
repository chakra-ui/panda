import { describe, expect, test } from 'vitest'
import { generateRecipes } from '../src/artifacts/js/recipe'
import { generator } from './fixture'

describe('generate recipes', () => {
  test('should ', () => {
    expect(generateRecipes(generator)).toMatchInlineSnapshot(`
      {
        "dts": "import type { ConditionalValue } from '../types'

      type TextStyleVariant = {
        size: \\"h1\\" | \\"h2\\"
      }

      type TextStyleVariantMap = {
        [key in keyof TextStyleVariant]: Array<TextStyleVariant[key]>
      }

      export type TextStyleVariants = {
        [key in keyof TextStyleVariant]?: ConditionalValue<TextStyleVariantMap[key]>
      }


      export declare function textStyle(variants?: TextStyleVariants): string & {
        variants: TextStyleVariantMap
      }

      type TooltipStyleVariant = {
        
      }

      type TooltipStyleVariantMap = {
        [key in keyof TooltipStyleVariant]: Array<TooltipStyleVariant[key]>
      }

      export type TooltipStyleVariants = {
        [key in keyof TooltipStyleVariant]?: ConditionalValue<TooltipStyleVariantMap[key]>
      }


      export declare function tooltipStyle(variants?: TooltipStyleVariants): string & {
        variants: TooltipStyleVariantMap
      }

      type ButtonStyleVariant = {
        size: \\"sm\\" | \\"md\\"
      variant: \\"solid\\" | \\"outline\\"
      }

      type ButtonStyleVariantMap = {
        [key in keyof ButtonStyleVariant]: Array<ButtonStyleVariant[key]>
      }

      export type ButtonStyleVariants = {
        [key in keyof ButtonStyleVariant]?: ConditionalValue<ButtonStyleVariantMap[key]>
      }


      export declare function buttonStyle(variants?: ButtonStyleVariants): string & {
        variants: ButtonStyleVariantMap
      }",
        "js": "import { createCss, withoutSpace, compact } from '../helpers.mjs';

      const createRecipe = (name, defaultVariants) => {
        return (variants) => {
         const transform = (prop, value) => {
            if (value === '__ignore__') {
              return { className: name }
            }

            value = withoutSpace(value)
            return { className: \`\${name}--\${prop}_\${value}\` }
         }
         
         const context = {
           hash: false,
           utility: {
             prefix: undefined,
             transform,
           }
         }
         
         const css = createCss(context)
         
         return css({
           [name]: '__ignore__',
           ...defaultVariants,
           ...compact(variants)
         })
        }
      }

      export const textStyle = createRecipe('textStyle', {})
      textStyle.variants = {\\"size\\":[\\"h1\\",\\"h2\\"]}

      export const tooltipStyle = createRecipe('tooltipStyle', {})
      tooltipStyle.variants = {}

      export const buttonStyle = createRecipe('buttonStyle', {\\"size\\":\\"md\\",\\"variant\\":\\"solid\\"})
      buttonStyle.variants = {\\"size\\":[\\"sm\\",\\"md\\"],\\"variant\\":[\\"solid\\",\\"outline\\"]}",
      }
    `)
  })
})
