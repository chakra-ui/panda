import { Dictionary, VarData } from '@css-panda/dictionary'
import { toCss, toKeyframeCss } from '@css-panda/atomic'
import { Conditions } from '@css-panda/types'
import { error } from '@css-panda/logger'

type GenerateCssOptions = {
  root?: string
  conditions?: Conditions
  keyframes?: Record<string, any>
}

export function generateCss(dict: Dictionary, options?: GenerateCssOptions) {
  const { root = ':where(:root, :host)', conditions = {}, keyframes } = options ?? {}

  function inner(vars: Map<string, VarData>, wrap = true) {
    const map = new Map<string, string>()

    for (const [key, { value }] of vars) {
      map.set(key, value)
    }

    const { css } = wrap
      ? toCss({
          [root]: Object.fromEntries(map),
        })
      : toCss(Object.fromEntries(map))

    return css
  }

  const output = [inner(dict.vars)]

  for (const [condition, conditionMap] of dict.conditionVars) {
    //
    const rawCondition = conditions[condition]
    const conditionStr = rawCondition.type === 'screen' ? rawCondition.rawValue : rawCondition.value.replace(/&/, root)

    if (!conditionStr) {
      error(`Condition ${conditionStr} is not defined`)
      continue
    }

    output.push(`${conditionStr} {\n ${inner(conditionMap, rawCondition.type === 'screen')} \n}`)
  }

  if (keyframes) {
    output.push(toKeyframeCss(keyframes))
  }

  return output.join('\n\n')
}
