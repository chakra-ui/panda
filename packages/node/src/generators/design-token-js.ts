import type { TokenMap } from '@css-panda/tokens'
import outdent from 'outdent'

export function generateDesignTokenJs(dict: TokenMap) {
  const map = new Map<string, { value: string; variable: string }>()

  for (const [key, entry] of dict.values.entries()) {
    map.set(key, { value: entry.value, variable: entry.varRef })
  }

  const obj = Object.fromEntries(map)

  return {
    js: outdent`
  const tokens = ${JSON.stringify(obj, null, 2)}
  
  function getToken(path) {
    const { value } = tokens[path] || {}
    return value
  }
  
  function getTokenVar(path) {
    const { variable } = tokens[path] || {}
    return variable
  }
  `,
    dts: outdent`
  import { Token } from "../types/token"
  export declare function getToken(path: Token): string
  export declare function getTokenVar(path: Token): string
  `,
  }
}
