import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSvaFn(ctx: Context) {
  return {
    js: outdent`
    ${ctx.file.import('getSlotRecipes', '../helpers')}
    ${ctx.file.import('cva', './cva')}

    export function sva(config) {
      const entries = Object.entries(getSlotRecipes(config))

      const slots = []
      
      for (const [slot, slotCva] of entries) {
        slots.push([slot, cva(slotCva)])
      }
      
      function svaFn(props) {
        const result = slots.map(([slot, cvaFn]) => [slot, cvaFn(props)])
        return Object.fromEntries(result)
      }

      return Object.assign(svaFn, {
        __sva__: true,
      })
    }
    `,
    dts: outdent`
    import type { SlotRecipeCreatorFn } from '../types/recipe'

    export declare const sva: SlotRecipeCreatorFn
    `,
  }
}
