import * as pandaDefs from '@pandacss/dev'
import { Config, Dict } from '@pandacss/types'

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
}

export const evalConfig = (config: string, _scope?: Dict): Config | null => {
  const codeTrimmed = config
    .replace(/export /g, '')
    .replace(/\bimport\b[^;]+;/g, '')
    .trim()

  try {
    const scope = Object.assign({}, pandaDefs, _scope)
    const config = evalCode(`return (() => {${codeTrimmed}; return config})()`, scope)
    if (!_scope) delete config.presets
    return config
  } catch (e) {
    return null
  }
}
