import { unionType, capitalize } from '@css-panda/shared'
import type { Recipe } from '@css-panda/types'
import { outdent } from 'outdent'

export function generateRecipes(config: { recipes?: Recipe[]; hash?: boolean }) {
  const { recipes = [], hash } = config

  const js = [
    outdent`
   import { createCss } from "../css/serializer"
  `,
  ]

  const dts = ['']

  recipes.forEach((recipe) => {
    js.push(outdent`
    export const ${recipe.name} = (styles) => {

     const transform = (prop, value) => {
        if (value === '__ignore__') {
          return { className: "${recipe.name}" }
        }

        value = value.toString().replaceAll(" ", "_")
        return { className: \`${recipe.name}__\${prop}-\${value}\` }
     }
     
     const context = ${hash ? '{ transform, hash: true }' : '{ transform }'}
     const css = createCss(context)
     
     return css({ ${recipe.name}: '__ignore__' , ...styles })
    }
    `)

    dts.push(outdent`
    import { UserConditionalValue as ConditionalValue } from "../types/public"

    export type ${capitalize(recipe.name)}Value = {
      ${Object.keys(recipe.variants ?? {})
        .map((key) => {
          const value = recipe.variants![key]
          const keys = Object.keys(value)
          return `${key}?: ConditionalValue<${unionType(keys)}>`
        })
        .join('\n')}
    }

    export declare function ${recipe.name}(value: ${capitalize(recipe.name)}Value): string
    `)
  })

  return {
    js: outdent.string(js.join('\n\n')),
    dts: outdent.string(dts.join('\n\n')),
  }
}
