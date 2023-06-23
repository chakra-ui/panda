import outdent from 'outdent'
import type { Context } from '../../engines'

export function generateStringLiteralConditions(ctx: Context) {
  return {
    js: outdent`
    ${ctx.file.import('withoutSpace', '../helpers')}

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
    }
      `,
    dts: outdent`
  `,
  }
}
