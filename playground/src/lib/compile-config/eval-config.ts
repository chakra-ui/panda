import * as pandaDefs from '@pandacss/dev'
import { Dict } from '@pandacss/types'

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
}

export const evalConfig = (config: string, _scope?: Dict) => {
  const codeTrimmed = config
    .replace(/export /g, '')
    .replace(/\bimport\b[^;]+;/g, '')
    .trim()

  try {
    const scope = Object.assign({}, pandaDefs, _scope)
    return evalCode(`return (() => {${codeTrimmed}; return config})()`, scope)
  } catch (e) {
    return null
  }
}
