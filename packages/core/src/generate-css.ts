import { Dictionary, VarData } from '@css-panda/dictionary'
import { toCss, expandKeyframes } from '@css-panda/atomic'
import { error } from '@css-panda/logger'

type GenerateCssOptions = {
  root: string
  conditions?: Record<string, string>
  keyframes?: Record<string, any>
}

export function generateCss(dict: Dictionary, options?: GenerateCssOptions) {
  const { root = ':where(:root, :host)', conditions = {}, keyframes } = options ?? {}

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

  const output = [inner(dict.vars)]

  for (const [condition, value] of dict.conditionVars) {
    //
    const rawCondition = conditions[condition]

    if (!rawCondition) {
      error(`Condition ${condition} is not defined`)
      continue
    }

    output.push(`${rawCondition} {\n ${inner(value)} \n}`)
  }

  if (keyframes) {
    output.push(expandKeyframes(keyframes))
  }

  return output.join('\n\n')
}
