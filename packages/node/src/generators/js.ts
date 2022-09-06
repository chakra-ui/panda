import type { TokenMap } from '@css-panda/tokens'
import outdent from 'outdent'

export function generateJs(dict: TokenMap) {
  const map = new Map<string, { value: string; variable: string }>()

  for (const [key, entry] of dict.values.entries()) {
    map.set(key, { value: entry.value, variable: entry.varRef })
  }

  const obj = Object.fromEntries(map)

  return outdent`
  const tokens = ${JSON.stringify(obj, null, 2)}
  
  function getToken(path) {
    const { value } = tokens[path] || {}
    return value
  }
  
  function getTokenVar(path) {
    const { variable } = tokens[path] || {}
    return variable
  }
  `
}
