import { toCss, toKeyframeCss } from '@pandacss/core'
import { outdent } from 'outdent'
import { match, P } from 'ts-pattern'
import type { PandaContext } from '../context'

export function generateKeyframes(keyframes: Record<string, any> | undefined) {
  if (keyframes) {
    return toKeyframeCss(keyframes)
  }
}

const getConditionMessage = (value: string) => outdent`
It seems you provided an invalid condition for semantic tokens.

- You provided: \`${value}\`

Valid conditions are those that reference a parent selectors or at-rules.
@media (min-width: 768px), or .dark &
`

export function generateTokenCss(ctx: PandaContext, varRoot?: string) {
  const root = varRoot ?? ctx.cssVarRoot

  const conditions = ctx.conditions
  const results: string[] = []

  for (const [key, values] of ctx.tokens.vars.entries()) {
    const varsObj = Object.fromEntries(values)
    if (Object.keys(varsObj).length === 0) continue

    if (key === 'base') {
      const { css } = toCss({ [root]: varsObj })
      results.push(css)
    } else {
      const cond = conditions.normalize(key)

      const css = match(cond)
        .with({ type: 'parent-nesting' }, (cond) => {
          const selector = cond.value.replace(/\s&/g, '')
          const { css } = toCss(varsObj)
          return `${selector} {\n ${css}; \n }`
        })
        .with({ type: 'at-rule' }, (cond) => {
          const selector = cond.rawValue ?? cond.raw
          const { css } = toCss(varsObj)
          return `${selector} { \n ${root} { \n ${css}; \n } \n }`
        })
        .with(P.nullish, () => {
          // no op
        })
        .otherwise((cond) => {
          if (cond) {
            throw new Error(getConditionMessage(cond.raw))
          }
        })

      if (css) {
        results.push(css)
      }
    }
  }

  const css = results.join('\n\n') + '\n\n'

  return `@layer tokens {
    ${css}
  }
  `
}
