import type { Context } from '@pandacss/core'
import type { RecipeSpec } from '@pandacss/types'

const getFirstVariantValue = (variantKeyMap: Record<string, string[]>, key: string): string | null => {
  const values = variantKeyMap[key]
  return values && values.length > 0 ? values[0] : null
}

const buildVariantProps = (
  variantKeys: string[],
  variantKeyMap: Record<string, string[]>,
  formatFn: (key: string, value: string) => string,
  separator: string,
): string => {
  return variantKeys
    .map((key) => {
      const value = getFirstVariantValue(variantKeyMap, key)
      return value ? formatFn(key, value) : null
    })
    .filter(Boolean)
    .join(separator)
}

export const generateRecipesSpec = (ctx: Context): RecipeSpec => {
  const recipes = ctx.recipes.details.map((node) => {
    const recipeName = node.baseName
    const jsxName = node.jsxName
    const variantKeys = Object.keys(node.variantKeyMap)

    const functionExamples: string[] = []
    const jsxExamples: string[] = []

    if (variantKeys.length === 0) {
      functionExamples.push(`${recipeName}()`)
      jsxExamples.push(`<${jsxName} />`)
    } else {
      // Generate examples for each variant key
      variantKeys.forEach((variantKey) => {
        const firstValue = getFirstVariantValue(node.variantKeyMap, variantKey)
        if (firstValue) {
          functionExamples.push(`${recipeName}({ ${variantKey}: '${firstValue}' })`)
          jsxExamples.push(`<${jsxName} ${variantKey}="${firstValue}" />`)
        }
      })

      // Generate an example with multiple variants if there are multiple variant keys
      if (variantKeys.length > 1) {
        const props = buildVariantProps(variantKeys, node.variantKeyMap, (key, value) => `${key}: '${value}'`, ', ')
        const jsxProps = buildVariantProps(variantKeys, node.variantKeyMap, (key, value) => `${key}="${value}"`, ' ')

        if (props && jsxProps) {
          functionExamples.push(`${recipeName}({ ${props} })`)
          jsxExamples.push(`<${jsxName} ${jsxProps} />`)
        }
      }
    }

    return {
      name: recipeName,
      description: node.config.description,
      variants: node.variantKeyMap,
      defaultVariants: node.config.defaultVariants ?? {},
      functionExamples,
      jsxExamples,
    }
  })

  return {
    type: 'recipes',
    data: recipes,
  }
}
