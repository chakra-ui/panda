import { describe, expect, test } from 'vitest'
import { generateRecipes } from '../src/artifacts/js/recipe'
import { generator } from './fixture'

describe('generate recipes', () => {
  test('should ', () => {
    expect(generateRecipes(generator)).toMatchInlineSnapshot(`
      {
        "dts": "import type { ConditionalValue } from '../types'

      export type TextStyleVariants = {
        size?: ConditionalValue<\\"h1\\" | \\"h2\\">
      }


      export declare function textStyle(variants?: TextStyleVariants): string & { variants: string[] }

      export type TooltipStyleVariants = {
        
      }


      export declare function tooltipStyle(variants?: TooltipStyleVariants): string & { variants: string[] }

      export type ButtonStyleVariants = {
        size?: ConditionalValue<\\"sm\\" | \\"md\\">
      variant?: ConditionalValue<\\"solid\\" | \\"outline\\">
      }


      export declare function buttonStyle(variants?: ButtonStyleVariants): string & { variants: string[] }",
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
      textStyle.variants = [\\"size\\"]

      export const tooltipStyle = createRecipe('tooltipStyle', {})
      tooltipStyle.variants = []

      export const buttonStyle = createRecipe('buttonStyle', {\\"size\\":\\"md\\",\\"variant\\":\\"solid\\"})
      buttonStyle.variants = [\\"size\\",\\"variant\\"]",
      }
    `)
  })
})
