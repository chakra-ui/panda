import * as pandaDefs from '@pandacss/dev'
import { Config, Dict, Preset } from '@pandacss/types'

export type PlaygroundConfig = Config & { presets: Preset[] }

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
}

export const evalConfig = (config: string, _scope?: Dict): PlaygroundConfig | null => {
  const codeTrimmed = config
    .replace(/export /g, '')
    .replace(/\bimport\b[^;]+;/g, '')
    .trim()

  try {
    const scope = Object.assign({}, pandaDefs, _scope)
    const config = evalCode(`return (() => {${codeTrimmed}; return config})()`, scope)
    return config
  } catch (e) {
    return null
  }
}
