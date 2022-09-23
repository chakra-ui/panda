import { toCss, toKeyframeCss } from '@css-panda/core'
import type { VarData } from '@css-panda/tokens'
import type { PandaContext } from '../context'

export function generateKeyframes(keyframes: Record<string, any> | undefined) {
  if (keyframes) {
    return toKeyframeCss(keyframes)
  }
}

export function generateCss(ctx: PandaContext, varRoot?: string) {
  const root = varRoot ?? ctx.cssVarRoot

  function inner(vars: Map<string, VarData>, wrap = true) {
    const map = new Map<string, string>()

    for (const [key, { value }] of vars) {
      map.set(key, value)
    }

    const styleObj = Object.fromEntries(map)

    if (Object.keys(styleObj).length === 0) {
      return ''
    }

    const { css } = wrap ? toCss({ [root]: styleObj }) : toCss(styleObj)

    return css
  }

  const output = [inner(ctx.tokens.vars)]

  const conditions = ctx.conditions

  for (const [condition, conditionMap] of ctx.tokens.conditionVars) {
    //
    const cond = conditions.normalize(condition)

    if (!cond) continue

    const selector = cond.rawValue ?? cond.value.replace(/&/, root)

    if (!selector) continue

    output.push(`${selector} {\n ${inner(conditionMap, cond.type === 'at-rule')} \n}`)
  }

  return output.join('\n\n') + '\n\n'
}
