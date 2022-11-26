import { prettifyCss, toCss, toKeyframeCss } from '@pandacss/core'
import { outdent } from 'outdent'
import { match } from 'ts-pattern'
import type { PandaContext } from '../context'

export function generateKeyframes(keyframes: Record<string, any> | undefined) {
  if (!keyframes) return
  return toKeyframeCss(keyframes)
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
      // nested conditionals in semantic tokens are joined by ":", so let's split it
      const keys = key.split(':')
      const { css } = toCss(varsObj)

      // sort the conditions so they are applied in the correct order
      // (parent selectors first, then at-rules)
      const sorted = conditions.sort(keys)
      const allAtRules = sorted.every(({ type }) => type === 'at-rule')

      const result = sorted.reduce(
        (acc, cond, index, conds) => {
          let selector: string | undefined

          return match(cond)
            .with({ type: 'parent-nesting' }, (cond) => {
              selector = cond.value.replace(/\s&/g, '')
              const merge = conds[index - 1]?.type === 'parent-nesting'
              // ASSUMPTION: the nature of parent selectors with tokens is that they're merged
              // [data-color-mode=dark][data-theme=pastel]
              return merge ? `${selector}${acc}` : `${selector} { \n ${acc} \n }`
            })
            .with({ type: 'at-rule' }, (cond) => {
              selector = cond?.rawValue ?? cond?.raw
              return `${selector} { \n ${acc} \n }`
            })
            .otherwise((cond) => {
              if (!cond) return acc
              throw new Error(getConditionMessage(cond.raw))
            })
        },
        // at rules need to be wrapped in a selector (root)
        allAtRules ? `${root} { \n ${css}  \n}` : css,
      )

      if (result) {
        results.push(result)
      }
    }
  }

  const css = results.join('\n\n') + '\n\n'

  // all tokens live in the tokens cascade layer
  return prettifyCss(`@layer tokens {
    ${css}
  }
  `)
}
