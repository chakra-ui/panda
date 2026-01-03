import type { Context } from '@pandacss/core'
import type { KeyframeSpec } from '@pandacss/types'
import { generateJsxExample, type JsxStyleProps } from '../shared'

const generateKeyframeJsxExamples = (name: string, jsxStyleProps: JsxStyleProps = 'all'): string[] => {
  const jsxExamples: string[] = []

  const example1 = generateJsxExample({ animationName: name }, jsxStyleProps)
  if (example1) {
    jsxExamples.push(example1)
  }

  // For the animation shorthand, we need a custom format
  const animationValue = `${name} 1s ease-in-out infinite`
  const example2 = generateJsxExample({ animation: animationValue }, jsxStyleProps)
  if (example2) {
    jsxExamples.push(example2)
  }

  return jsxExamples
}

export const generateKeyframesSpec = (ctx: Context): KeyframeSpec => {
  const jsxStyleProps = ctx.config.jsxStyleProps

  const keyframes = Object.keys(ctx.config.theme?.keyframes ?? {}).map((name) => ({
    name,
    functionExamples: [`css({ animationName: '${name}' })`, `css({ animation: '${name} 1s ease-in-out infinite' })`],
    jsxExamples: generateKeyframeJsxExamples(name, jsxStyleProps),
  }))

  return {
    type: 'keyframes',
    data: keyframes,
  }
}
