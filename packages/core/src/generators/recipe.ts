import { outdent } from 'outdent'

export function generateRecipes(config: any, hash?: boolean) {
  let recipes = [
    outdent`
   import { createCss } from "../css/serializer"
  `,
  ]

  config.recipes.forEach((recipe: any) => {
    recipes.push(outdent`
     export const ${recipe.name} = (styles) => {

     const transform = (prop, value) => {
        if (value === '__ignore__') {
           return { className: ${recipe.name} }
        }

        return { className: \`${recipe.name}__\${prop}-\${value}\` }
     }
     
     const context = ${hash ? '{ transform, hash: true }' : '{ transform }'}
     const css = createCss(context)
     
     const classNames = new Set()
     classNames.add('${recipe.name}')
     classNames.add(css(styles))

     return Array.from(classNames).join(' ')
     }
    `)
  })

  return outdent.string(recipes.join('\n\n'))
}
