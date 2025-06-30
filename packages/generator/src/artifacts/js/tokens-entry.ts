import type { Context } from '@pandacss/core'
import outdent from 'outdent'

export function getTokenVarName(name: string) {
  return name.replace(/(?:\.-(\d+))/g, '.n$1').replace(/\./g, '_')
}

export function tryGetTokenVarName(name: string) {
  const reserved = [/_/, /\.n(\d+)/]
  if (reserved.some((regex) => regex.test(name))) return undefined
  const varName = getTokenVarName(name)
  return /^[a-z$_][\w$]*$/i.test(varName) ? varName : undefined
}

export function generateTokensEntryJs(ctx: Context) {
  const { tokens } = ctx
  const map = new Map<
    string,
    {
      nameExpr: string
      valueExpr: string
      isExportable: boolean
    }
  >()

  tokens.allTokens.forEach((token) => {
    const { varRef, isVirtual } = token.extensions
    const value = isVirtual || token.extensions.condition !== 'base' ? varRef : token.value
    const exportName = tryGetTokenVarName(token.name)
    map.set(token.name, {
      nameExpr: exportName ?? JSON.stringify(token.name),
      valueExpr: `t(${JSON.stringify(value)}, ${JSON.stringify(varRef)})`,
      isExportable: !!exportName,
    })
  })

  const entries = Object.values(Object.fromEntries(map))
  const nonExportable = entries.some((entry) => !entry.isExportable)

  return {
    js: outdent`
  const t = (value, variable) => {
    value.var = variable;
    return value;
  }
  
  ${entries
    .filter((entry) => entry.isExportable)
    .map((entry) => `export const ${entry.nameExpr} = ${entry.valueExpr};`)
    .join('\n')}

  export const $ = {};
  ${entries
    .filter((entry) => !entry.isExportable)
    .map((entry) => `$[${entry.nameExpr}] = ${entry.valueExpr};`)
    .join('\n')}
  `,
    dts: outdent`
  export type TokenValue = string & { var: string }

  ${entries
    .filter((entry) => entry.isExportable)
    .map((entry) => `export declare const ${entry.nameExpr}: TokenValue`)
    .join('\n')}

  ${
    nonExportable
      ? `export declare const $: Record<${entries
          .filter((entry) => !entry.isExportable)
          .map((entry) => entry.nameExpr)
          .join(' | ')}, string>;`
      : ''
  }
  
  `,
  }
}
