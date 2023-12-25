import { Config } from '@pandacss/types'
import { useEffect, useState } from 'react'
import * as pandaDefs from '@pandacss/dev'

export const useConfig = (_config: string) => {
  const [config, setConfig] = useState<Config | null>(evalConfig(_config))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      const newUserConfig = evalConfig(_config)
      if (newUserConfig) setConfig(newUserConfig)
    } catch (_error: any) {
      setError(_error)
    }
  }, [_config])

  return { config, error }
}

const evalCode = (code: string, scope: Record<string, unknown>) => {
  const scopeKeys = Object.keys(scope)
  const scopeValues = scopeKeys.map((key) => scope[key])
  return new Function(...scopeKeys, code)(...scopeValues)
}

const evalConfig = (config: string) => {
  const codeTrimmed = config
    .replaceAll(/export /g, '')
    .replaceAll(/import\s*{[^}]+}\s*from\s*['"][^'"]+['"];\n*/g, '')
    .trim()
    .replace(/;$/, '')

  try {
    return evalCode(`return (() => {${codeTrimmed}; return config})()`, pandaDefs)
  } catch (e) {
    return null
  }
}
