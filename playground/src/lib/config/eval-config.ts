import * as pandaDefs from '@pandacss/dev'
import { Config, Dict, Preset } from '@pandacss/types'
import { transform } from 'sucrase'

export type PlaygroundConfig = Config & { presets: Preset[] }

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
}

export const evalConfig = (configStr: string, _scope?: Dict): PlaygroundConfig | null => {
  const configJs = transform(configStr, { transforms: ['typescript'] }).code

  const codeTrimmed = configJs
    .replace(/export /g, '')
    .replace(/\bimport\b[^\n;]+[;\n]?/g, '')
    .trim()

  const scope = Object.assign({}, pandaDefs, _scope)
  const config = evalCode(`return (() => {${codeTrimmed}; return config})()`, scope)
  return config
}

export const getConfigError = (configStr: string) => {
  try {
    evalConfig(configStr)
    return null
  } catch (error) {
    return error as Error
  }
}

export const validateConfig = (configStr: string) => {
  try {
    return evalConfig(configStr)
  } catch (error) {
    return null
  }
}
