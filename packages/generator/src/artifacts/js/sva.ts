import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateSvaFn(ctx: Context) {
  return {
    js: outdent`
    ${ctx.file.import('getSlotRecipes, splitProps', '../helpers')}
    ${ctx.file.import('cva', './cva')}

    export function sva(config) {
      const slots = Object.entries(getSlotRecipes(config)).map(([slot, slotCva]) => [slot, cva(slotCva)])
      
      function svaFn(props) {
        const result = slots.map(([slot, cvaFn]) => [slot, cvaFn(props)])
        return Object.fromEntries(result)
      }

      const variants = config.variants ?? {};
      const variantKeys = Object.keys(variants);

      function splitVariantProps(props) {
        return splitProps(props, variantKeys);
      }

      const variantMap = Object.fromEntries(
        Object.entries(variants).map(([key, value]) => [key, Object.keys(value)])
      );

      return Object.assign(svaFn, {
        __cva__: false,
        variantMap,
        variantKeys,
        splitVariantProps,
      })
    }
    `,
    dts: outdent`
    ${ctx.file.importType('SlotRecipeCreatorFn', '../types/recipe')}

    export declare const sva: SlotRecipeCreatorFn
    `,
  }
}
