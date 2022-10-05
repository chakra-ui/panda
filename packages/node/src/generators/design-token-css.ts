import { toCss, toKeyframeCss } from '@css-panda/core'
import type { VarData } from '@css-panda/tokens'
import { outdent } from 'outdent'
import type { PandaContext } from '../context'

export function generateKeyframes(keyframes: Record<string, any> | undefined) {
  if (keyframes) {
    return toKeyframeCss(keyframes)
  }
}

export function generateDesignTokenCss(ctx: PandaContext, varRoot?: string) {
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

    if (cond.type !== 'at-rule' && cond.type !== 'parent-nesting') {
      throw new Error(
        outdent`
      It seems you provided an invalid condition for semantic tokens.
      
      - You provided: \`${cond.raw}\`
      
      Valid conditions are those that reference a parent selectors or at-rules.
      @media (min-width: 768px), or .dark &
      `,
      )
    }

    let selector: string | undefined

    if (cond.type === 'parent-nesting') {
      selector = cond.value.replace(/\s&/g, '')
    }

    if (cond.type === 'at-rule') {
      selector = cond.rawValue
    }

    if (!selector) continue

    output.push(`${selector} {\n ${inner(conditionMap, cond.type === 'at-rule')} \n}`)
  }

  return output.join('\n\n') + '\n\n'
}
