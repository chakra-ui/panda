import type { TokenDictionary } from '@pandacss/token-dictionary'
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
  
  export function token(path) {
    const { value } = tokens[path] || {}
    return value
  }
  
  function tokenVar(path) {
    const { variable } = tokens[path] || {}
    return variable
  }

  token.var = tokenVar
  `,
    dts: outdent`
  import type { Token } from '../types/token'
  export declare function token(path: Token): string & { var: (path: Token) => string }
  `,
  }
}
