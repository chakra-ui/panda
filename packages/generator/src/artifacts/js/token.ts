import { ArtifactFile } from '../artifact-map'

export const tokenJsArtifact = new ArtifactFile({
  id: 'tokens/index.js',
  fileName: 'index',
  type: 'js',
  dir: (ctx) => ctx.paths.token,
  dependencies: ['theme.tokens', 'theme.semanticTokens'],
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
  fileName: 'index',
  type: 'dts',
  dir: (ctx) => ctx.paths.token,
  dependencies: [],
  importsType: {
    'tokens/tokens.d.ts': ['Token'],
  },
  code(params) {
    return `
    export declare const token: {
      (path: Token, fallback?: string): string
      var: (path: Token, fallback?: string) => string
    }

    ${params.file.exportTypeStar('./tokens')}
    `
  },
})
