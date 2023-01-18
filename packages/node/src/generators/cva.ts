import { outdent } from 'outdent'

export function generateCvaFn() {
  return {
    js: outdent`
    import { compact, deepMerge } from '../helpers'
    import { css } from './css'
    
    export function cva(config) {
      const { base = {}, variants = {}, defaultVariants = {} } = config
      return (props) => {
        const computedVariants = { ...defaultVariants, ...compact(props) }
        let result = { ...base }
        for (const [key, value] of Object.entries(computedVariants)) {
          if (variants[key]?.[value]) {
            result = deepMerge(result, variants[key][value])
          }
        }
        return css(result)
      }
    }
    `,
    dts: outdent`
    import { SystemStyleObject } from '../types'

    type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T

    type Variants = Record<string, Record<string, SystemStyleObject>>

    type VariantSelection<T extends Variants> = {
      [Variant in keyof T]?: StringToBoolean<keyof T[Variant]>
    }

    type AtomicRecipe<T extends Variants> = {
      base?: SystemStyleObject
      variants?: T | Variants
      defaultVariants?: VariantSelection<T>
    }

    type VariantFn<T extends Variants> = (props: VariantSelection<T>) => string

    export type VariantProps<T extends VariantFn<Variants>> = Parameters<T>[0]

    export declare function cva<T extends Variants>(recipe?: AtomicRecipe<T>): VariantFn<T>

    `,
  }
}
