import type { Context } from '@pandacss/core'
import { isObject, walkObject } from '@pandacss/shared'
import type { AnimationStyleSpec } from '@pandacss/types'

const collectAnimationStyles = (values: Record<string, any>): Array<{ name: string; description?: string }> => {
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

export const generateAnimationStylesSpec = (ctx: Context): AnimationStyleSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps ?? 'all'
  const animationStyles = collectAnimationStyles(ctx.config.theme?.animationStyles ?? {})

  const animationStylesSpec = animationStyles.map((style) => {
    const functionExamples: string[] = [`css({ animationStyle: '${style.name}' })`]
    const jsxExamples: string[] = []

    if (jsxStyleProps === 'all') {
      jsxExamples.push(`<Box animationStyle="${style.name}" />`)
    } else if (jsxStyleProps === 'minimal') {
      jsxExamples.push(`<Box css={{ animationStyle: '${style.name}' }} />`)
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
    type: 'animation-styles',
    data: animationStylesSpec,
  }
}
