import type { TokenMap } from '@css-panda/tokens'
import outdent from 'outdent'

export function generateTokenJs(dict: TokenMap) {
  const map = new Map<string, { value: string; variable: string }>()

  dict.forEach((token) => {
    const value = token.condition ? token.varRef : token.value
    map.set(token.prop, { value, variable: token.varRef })
  })

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
