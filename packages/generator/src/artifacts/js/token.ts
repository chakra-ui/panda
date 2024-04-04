import type { Context } from '@pandacss/core'
import outdent from 'outdent'
import cssVar from '../generated/css-var.mjs.json' assert { type: 'json' }

export function generateTokenJs(ctx: Context) {
  const { tokens } = ctx

  const tokenList = tokens.allTokens.map((token) => {
    const { isVirtual } = token.extensions
    const path = token.path.filter(Boolean).join('.')
    if (isVirtual || token.extensions.condition !== 'base') return [path]
    return [path, token.value]
  })

  const { hash, prefix } = ctx

  return {
    js: outdent`
  ${cssVar.content}

  //
  const formatCssVar = ${tokens.formatCssVar}
  const formatTokenName = ${tokens.formatTokenName}
  const toHash = ${ctx.utility.toHash}
  const options = {
    ${[prefix.className ? 'prefix: ' + JSON.stringify(prefix.className) : '', hash.className ? 'hash: true' : '', 'toHash', 'cssVar'].filter(Boolean).join(',\n')}
  }
  //
  const tokenList = ${JSON.stringify(tokenList)}

  const tokens = tokenList.reduce((acc, [key, _value]) => {
    const path = key.split(".")
    const name = formatTokenName(path)

    const variable = formatCssVar(path, options).ref
    const value = _value == null ? variable : _value
    acc[name] = { value, variable }

    return acc
  }, {})

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
