import type { Context } from '@pandacss/core'
import type { KeyframeSpec } from '@pandacss/types'

export const generateKeyframesSpec = (ctx: Context): KeyframeSpec => {
  const keyframes = Object.keys(ctx.config.theme?.keyframes ?? {}).map((name) => ({
    name,
    functionExamples: [`css({ animationName: '${name}' })`, `css({ animation: '${name} 1s ease-in-out infinite' })`],
    jsxExamples: [`<Box animationName="${name}" />`, `<Box animation="${name} 1s ease-in-out infinite" />`],
  }))

  return {
    type: 'keyframes',
    data: keyframes,
  }
}
