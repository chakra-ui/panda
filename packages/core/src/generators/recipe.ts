import { Recipe } from '@css-panda/types'
import { outdent } from 'outdent'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function generateRecipes(config: { recipes?: Recipe[] }, hash?: boolean) {
  const js = [
    outdent`
   import { createCss } from "../css/serializer"
  `,
  ]

  const dts = ['']

  ;(config.recipes ?? []).forEach((recipe) => {
    js.push(outdent`
    export const ${recipe.name} = (styles) => {

     const transform = (prop, value) => {
        value = value.toString().replaceAll(" ", "_")
        return { className: \`${recipe.name}__\${prop}-\${value}\` }
     }
     
     const context = ${hash ? '{ transform, hash: true }' : '{ transform }'}
     const css = createCss(context)
     
     return ['${recipe.name}', css(styles)].join(' ')
    }
    `)

    dts.push(outdent`
    import { UserConditionalValue as ConditionalValue } from "../types/public"

    export type ${capitalize(recipe.name)}Value = {
      ${Object.keys(recipe.variants ?? {})
        .map((key) => {
          const value = recipe.variants![key]
          const enums = Object.keys(value)
            .map((t) => JSON.stringify(t))
            .join(' | ')
          return `${key}?: ConditionalValue<${enums}>`
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
