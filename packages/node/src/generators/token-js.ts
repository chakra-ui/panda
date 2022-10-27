import type { TokenDictionary } from '@css-panda/token-dictionary'
import outdent from 'outdent'

export function generateTokenJs(dict: TokenDictionary) {
  const map = new Map<string, { value: string; variable: string }>()

  dict.allTokens.forEach((token) => {
    const { varRef } = token.extensions
    const value = token.isConditional ? varRef : token.value
    map.set(token.name, { value, variable: varRef })
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
