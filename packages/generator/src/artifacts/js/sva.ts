import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSvaFn(ctx: Context) {
  return {
    js: outdent`
    ${ctx.file.import('getSlotRecipes', '../helpers')}
    ${ctx.file.import('cva', './cva')}

    export function sva(config) {
      const slots = Object.entries(getSlotRecipes(config)).map(([slot, slotCva]) => [slot, cva(slotCva)])
      
      function svaFn(props) {
        const result = slots.map(([slot, cvaFn]) => [slot, cvaFn(props)])
        return Object.fromEntries(result)
      }

      const [, firstCva] = slots[0]

      return Object.assign(svaFn, {
        __cva__: false,
        variantMap: firstCva.variantMap,
        variantKeys: firstCva.variantKeys,
        splitVariantProps: firstCva.splitVariantProps,
      })
    }
    `,
    dts: outdent`
    import type { SlotRecipeCreatorFn } from '../types/recipe'

    export declare const sva: SlotRecipeCreatorFn
    `,
  }
}
