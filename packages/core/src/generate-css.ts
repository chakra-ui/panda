import { Dictionary, VarData } from '@css-panda/dictionary'
import { toCss } from '@css-panda/atomic'
import { error } from '@css-panda/logger'
import outdent from 'outdent'

type CssOptions = {
  root: string
  conditions?: Record<string, string>
}

export function generateCss(dict: Dictionary, options?: CssOptions) {
  const { root = ':where(:root, :host)', conditions = {} } = options ?? {}

  function inner(vars: Map<string, VarData>) {
    const map = new Map<string, string>()

    for (const [key, { value }] of vars) {
      map.set(key, value)
    }

    const { css } = toCss({
      [root]: Object.fromEntries(map),
    })

    return css
  }

  const base = inner(dict.vars)

  const conditionMap: string[] = []

  for (const [condition, value] of dict.conditionVars) {
    const rawCondition = conditions[condition]
    if (!rawCondition) {
      error(`Condition ${condition} is not defined`)
      continue
    }
    const conditionCss = inner(value)
    conditionMap.push(`${rawCondition} {\n ${conditionCss} \n}`)
  }

  return outdent`
  ${base}

  ${conditionMap.join('\n\n')}`
}
