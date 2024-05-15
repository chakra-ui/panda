import { ArtifactFile } from '../artifact'

export const tokenJsArtifact = new ArtifactFile({
  id: 'tokens/index.js',
  fileName: 'token',
  type: 'js',
  dir: (ctx) => ctx.paths.token,
  dependencies: [],
  computed(ctx) {
    return { tokens: ctx.tokens }
  },
  code(params) {
    const { tokens } = params.computed
    const map = new Map<string, { value: string; variable: string }>()

    tokens.allTokens.forEach((token) => {
      const { varRef, isVirtual } = token.extensions
      const value = isVirtual || token.extensions.condition !== 'base' ? varRef : token.value
      map.set(token.name, { value, variable: varRef })
    })

    const obj = Object.fromEntries(map)

    return `
    const tokens = ${JSON.stringify(obj, null, 2)}

    export function token(path, fallback) {
      return tokens[path]?.value || fallback
    }

    function tokenVar(path, fallback) {
      return tokens[path]?.variable || fallback
    }

    token.var = tokenVar`
  },
})

export const tokenDtsArtifact = new ArtifactFile({
  id: 'tokens/index.d.ts',
  fileName: 'token',
  type: 'dts',
  dir: (ctx) => ctx.paths.token,
  dependencies: [],
  importsType: {
    'types/index.d.ts': ['Token'],
  },
  computed(ctx) {
    return { exportTypeStar: ctx.file.exportTypeStar }
  },
  code(params) {
    return `
    export declare const token: {
      (path: Token, fallback?: string): string
      var: (path: Token, fallback?: string) => string
    }

    ${params.computed.exportTypeStar('./tokens')}
    `
  },
})
