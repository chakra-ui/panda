import type { Context } from '@pandacss/core'
import outdent from 'outdent'
import { getTokenVarName } from './tokens-entry'

export function generateTokenJs(ctx: Context) {
  return {
    js: outdent`
  import * as tokens from './tokens-entry.mjs';

  ${getTokenVarName.toString()}

  export { tokens }
  
  export function token(path, fallback) {
    const value = tokens.$[path] ?? tokens[getTokenVarName(path)]
    return value || fallback
  }

  function tokenVar(path, fallback) {
    return token(path)?.var || fallback
  }

  token.var = tokenVar
  `,
    dts: outdent`
  ${ctx.file.importType('Token', './tokens')}
  export * as tokens from './tokens-entry.d.ts'

  export declare const token: {
    (path: Token, fallback?: string): string
    var: (path: Token, fallback?: string) => string
  }

  ${ctx.file.exportTypeStar('./tokens')}
  `,
  }
}
