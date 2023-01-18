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