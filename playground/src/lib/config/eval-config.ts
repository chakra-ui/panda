import * as pandaDefs from '@pandacss/dev'
import { Config, Dict, Preset } from '@pandacss/types'

export type PlaygroundConfig = Config & { presets: Preset[] }

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
}

export const evalConfig = (configStr: string, _scope?: Dict): PlaygroundConfig | null => {
  const codeTrimmed = configStr
    .replace(/export /g, '')
    .replace(/\bimport\b[^\n;]+[;\n]?/g, '')
    .trim()

  const scope = Object.assign({}, pandaDefs, _scope)
  const config = evalCode(`return (() => {${codeTrimmed}; return config})()`, scope)
  return config
}
