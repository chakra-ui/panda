import type { Context } from '@pandacss/core'
import { isObject, walkObject } from '@pandacss/shared'
import type { TextStyleSpec } from '@pandacss/types'

const collectTextStyles = (values: Record<string, any>): Array<{ name: string; description?: string }> => {
  const result: Array<{ name: string; description?: string }> = []

  walkObject(
    values,
    (token, paths) => {
      if (token && isObject(token) && 'value' in token) {
        const filteredPaths = paths.filter((item) => item !== 'DEFAULT')
        result.push({
          name: filteredPaths.join('.'),
          description: token.description,
        })
      }
    },
    {
      stop: (v) => isObject(v) && 'value' in v,
    },
  )

  return result
}

export const generateTextStylesSpec = (ctx: Context): TextStyleSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps ?? 'all'
  const textStyles = collectTextStyles(ctx.config.theme?.textStyles ?? {})

  const textStylesSpec = textStyles.map((style) => {
    const functionExamples: string[] = [`css({ textStyle: '${style.name}' })`]
    const jsxExamples: string[] = []

    if (jsxStyleProps === 'all') {
      jsxExamples.push(`<Box textStyle="${style.name}" />`)
    } else if (jsxStyleProps === 'minimal') {
      jsxExamples.push(`<Box css={{ textStyle: '${style.name}' }} />`)
    }
    // 'none' - no JSX examples

    return {
      name: style.name,
      description: style.description,
      functionExamples,
      jsxExamples,
    }
  })

  return {
    type: 'text-styles',
    data: textStylesSpec,
  }
}
