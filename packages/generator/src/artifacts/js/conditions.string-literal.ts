import { ArtifactFile } from '../artifact'

export const stringLiteralConditionsJsArtifact = new ArtifactFile({
  id: 'css/conditions.js',
  fileName: 'conditions',
  type: 'js',
  dir: (ctx) => ctx.paths.css,
  dependencies: ['syntax'],
  imports: {
    'helpers.js': ['withoutSpace'],
  },
  code() {
    return `
    export const isCondition = (val) => condRegex.test(val)

    const condRegex = /^@|&|&$/
    const selectorRegex = /&|@/

    export const finalizeConditions = (paths) => {
      return paths.map((path) => (selectorRegex.test(path) ? \`[\${withoutSpace(path.trim())}]\` : path))
    }

    export function sortConditions(paths){
      return paths.sort((a, b) => {
        const aa = isCondition(a)
        const bb = isCondition(b)
        if (aa && !bb) return 1
        if (!aa && bb) return -1
        return 0
      })
    }`
  },
})
