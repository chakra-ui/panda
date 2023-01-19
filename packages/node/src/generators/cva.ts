import { outdent } from 'outdent'

export function generateCvaFn() {
  return {
    js: outdent`
    import { compact } from '../helpers'
    import { css, mergeCss } from './css'
    
    export function cva(config) {
      const { base = {}, variants = {}, defaultVariants = {} } = config
      
      function resolve(props) {
        const computedVariants = { ...defaultVariants, ...compact(props) }
        let result = { ...base }
        for (const [key, value] of Object.entries(computedVariants)) {
          if (variants[key]?.[value]) {
            result = mergeCss(result, variants[key][value])
          }
        }
        return result
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
    `,
    dts: outdent`
    import { RecipeCreatorFn } from '../types/recipe'

    export declare const cva: RecipeCreatorFn

    `,
  }
}
