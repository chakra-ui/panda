import { toCss, toKeyframeCss } from '@css-panda/core'
import type { VarData } from '@css-panda/tokens'
import type { Context } from '../create-context'

export function generateKeyframes(ctx: Context) {
  if (ctx.config.keyframes) {
    return toKeyframeCss(ctx.config.keyframes)
  }
}

export function generateCss(ctx: Context, root = ':where(:root, :host)') {
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

  const output = [inner(ctx.dictionary.vars)]

  const { conditions } = ctx.context()

  for (const [condition, conditionMap] of ctx.dictionary.conditionVars) {
    //
    const cond = conditions.normalize(condition)

    if (!cond) continue

    const selector = cond.rawValue ?? cond.value.replace(/&/, root)

    if (!selector) continue

    output.push(`${selector} {\n ${inner(conditionMap, cond.type === 'at-rule')} \n}`)
  }

  return output.join('\n\n') + '\n\n'
}
