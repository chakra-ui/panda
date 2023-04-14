import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateCvaFn(ctx: Context) {
  return {
    js: outdent`
    ${ctx.file.import('compact', '../helpers')}
    ${ctx.file.import('css, mergeCss', './css')}

    export function cva(config) {
      const { base = {}, variants = {}, defaultVariants = {}, compoundVariants = [] } = config

      function resolve(props) {
        const computedVariants = { ...defaultVariants, ...compact(props) }
        let variantCss = { ...base }
        for (const [key, value] of Object.entries(computedVariants)) {
          if (variants[key]?.[value]) {
            variantCss = mergeCss(variantCss, variants[key][value])
          }
        }
        const compoundVariantCss = getCompoundVariantCss(compoundVariants, computedVariants)
        return mergeCss(variantCss, compoundVariantCss)
      }

      function cvaFn(props) {
        return css(resolve(props))
      }

      return Object.assign(cvaFn, {
        __cva__: true,
        variants: Object.keys(variants),
        resolve,
        config,
      })
    }

    export function getCompoundVariantCss(compoundVariants, variantMap) {
      let result = {}
      compoundVariants.forEach((compoundVariant) => {
        const isMatching = Object.entries(compoundVariant).every(([key, value]) => {
          if (key === 'css') return true

          const values = Array.isArray(value) ? value : [value]
          return values.some((value) => variantMap[key] === value)
        })

        if (isMatching) {
          result = mergeCss(result, compoundVariant.css)
        }
      })

      return result
    }

    export function assertCompoundVariant(name, compoundVariants, variants, prop) {
      if (compoundVariants.length > 0 && typeof variants[prop] === 'object') {
        throw new Error(
          \`[recipe:\${name}:\${prop}] Conditions are not supported when using compound variants.\`,
        )
      }
    }    

    `,
    dts: outdent`
    import type { RecipeCreatorFn } from '../types/recipe'

    export declare const cva: RecipeCreatorFn

    `,
  }
}
