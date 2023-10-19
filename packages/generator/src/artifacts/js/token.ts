import outdent from 'outdent'
import type { Context } from '../../engines'

export function generateTokenJs(ctx: Context) {
  const { tokens } = ctx

  // encode token as:
  // path[]variable[]value<!

  // ex:
  // { path: 'blurs.sm', value: '4px', variable: 'var(--inkeep-blurs-sm)', result: 'blurs.sm[]4px[]var(--inkeep-blurs-sm)<!' }
  // { path: 'fonts.serif', value: 'ui-serif, Georgia, "Times New Roman"', variable: 'var(--fonts-serif)', result: 'fonts.serif[]ui-serif, Georgia, "Times New Roman"[]var(--fonts-serif)<!' }

  const tokenList = tokens.allTokens
    .map((token) => {
      const { varRef } = token.extensions
      const parts = [token.name, varRef]
      if (!token.isConditional) parts.push(token.value)
      return parts.join('[]')
    })
    .join('<!')

  return {
    js: outdent`
  const tokenList = \`${tokenList}\`;

  const tokens = Object.fromEntries(tokenList.split('<!').map((token) => {
    const [name, variable, value] = token.split('[]')
    return [name, { value: value || variable, variable }]
  }))

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
