import type { Context } from '@pandacss/core'
import type { PatternSpec } from '@pandacss/types'

export const generatePatternsSpec = (ctx: Context): PatternSpec => {
  const patterns = ctx.patterns.details.map((node) => {
    const patternName = node.baseName
    const jsxName = node.jsxName

    const properties = Object.entries(node.config.properties ?? {})

    // Generate examples for each property
    const functionExamples: string[] = []
    const jsxExamples: string[] = []

    if (properties.length === 0) {
      // No properties, just show basic usage
      functionExamples.push(`${patternName}()`)
      jsxExamples.push(`<${jsxName} />`)
    } else {
      // Generate examples for each property
      properties.forEach(([propName, prop]) => {
        // Generate example value based on property type
        let exampleValue = '<value>'

        if (prop.type === 'enum' && prop.value?.length > 0) {
          exampleValue = `"${prop.value[0]}"`
        } else if (prop.type === 'boolean') {
          exampleValue = 'true'
        } else if (prop.type === 'number') {
          exampleValue = '4'
        } else if (prop.type === 'token') {
          exampleValue = '"md"'
        }

        functionExamples.push(`${patternName}({ ${propName}: ${exampleValue} })`)
        jsxExamples.push(`<${jsxName} ${propName}={${exampleValue}} />`)
      })
    }

    // Get default values if they exist
    const defaultValues = typeof node.config.defaultValues === 'object' ? node.config.defaultValues : {}

    return {
      name: patternName,
      description: node.config.description,
      properties: properties.map(([name, prop]) => ({
        name,
        type: ctx.patterns.getPropertyType(prop),
        description: prop.description,
        defaultValue: defaultValues[name],
      })),
      jsx: jsxName,
      functionExamples,
      jsxExamples,
    }
  })

  return {
    type: 'patterns',
    data: patterns,
  }
}
