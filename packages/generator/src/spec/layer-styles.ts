import type { Context } from '@pandacss/core'
import { isObject, walkObject } from '@pandacss/shared'
import type { LayerStyleSpec } from '@pandacss/types'

const collectLayerStyles = (values: Record<string, any>): Array<{ name: string; description?: string }> => {
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

export const generateLayerStylesSpec = (ctx: Context): LayerStyleSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps ?? 'all'
  const layerStyles = collectLayerStyles(ctx.config.theme?.layerStyles ?? {})

  const layerStylesSpec = layerStyles.map((style) => {
    const functionExamples: string[] = [`css({ layerStyle: '${style.name}' })`]
    const jsxExamples: string[] = []

    if (jsxStyleProps === 'all') {
      jsxExamples.push(`<Box layerStyle="${style.name}" />`)
    } else if (jsxStyleProps === 'minimal') {
      jsxExamples.push(`<Box css={{ layerStyle: '${style.name}' }} />`)
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
    type: 'layer-styles',
    data: layerStylesSpec,
  }
}
