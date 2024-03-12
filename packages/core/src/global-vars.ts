import type { GlobalVars } from '@pandacss/types'
import { stringify } from './stringify'

export const stringifyGlobalVars = (globalVars: GlobalVars, cssVarRoot: string) => {
  if (!globalVars) return ''

  const cssCustomProps = [] as string[]
  const vars = { [cssVarRoot]: {} as Record<string, string> }
  const base = vars[cssVarRoot]

  Object.entries(globalVars).forEach(([key, value]) => {
    if (typeof value === 'string') {
      base[key] = value
      return
    }

    const css = `@property ${key} {
      syntax: '${value.syntax}';
      inherits: ${value.inherits};
      initial-value: ${value.initialValue};
    }`
    cssCustomProps.push(css)
  })

  const lines: string[] = []
  lines.push(stringify(vars))
  lines.push(...cssCustomProps)

  return lines.join('\n\n')
}
