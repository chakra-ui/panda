import outdent from 'outdent'
import type { Context } from '../../engines'

export function generateTokenJs(ctx: Context) {
  const { tokens } = ctx
  const map = new Map<string, { value: string; variable: string }>()

  tokens.allTokens.forEach((token) => {
    const { varRef } = token.extensions
    const value = token.isConditional ? varRef : token.value
    map.set(token.name, { value, variable: varRef })
  })

  const obj = Object.fromEntries(map)

  return {
    js: outdent`
  const tokens = ${JSON.stringify(obj, null, 2)}

  export function token(path, fallback) {
    return tokens[path]?.value || fallback
  }

  function tokenVar(path, fallback) {
    return tokens[path]?.variable || fallback
  }

  token.var = tokenVar
  `,
    dts: outdent`
  ${ctx.file.importType('Token', './tokens')}

  export declare const token: {
    (path: Token, fallback?: string): string
    var: (path: Token, fallback?: string) => string
  }

  ${ctx.file.exportTypeStar('./tokens')}
  `,
  }
}
