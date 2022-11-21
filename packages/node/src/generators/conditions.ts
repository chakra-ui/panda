import { unionType } from '@pandacss/shared'
import outdent from 'outdent'
import type { PandaContext } from '../context'

export function generateConditions(ctx: PandaContext) {
  const keys = Object.keys(ctx.conditions.values).concat('_', 'base')
  return {
    js: outdent`
     const conditions = new Set([${keys.map((key) => JSON.stringify(key))}])
     
     export function isCondition(value){
      return conditions.has(value) || /^@|&|&$/.test(value)
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
  export type Condition = ${unionType(keys)}
  export type Conditions = Record<Condition, string>
  `,
  }
}
