import { compact } from '../helpers.mjs';
import { css, mergeCss } from './css.mjs';

export function cva(config) {
  const { base = {}, variants = {}, defaultVariants = {}, compoundVariants = [] } = config

  function resolve(props) {
    const computedVariants = { ...defaultVariants, ...compact(props) }
    let result = { ...base }
    for (const [key, value] of Object.entries(computedVariants)) {
      if (variants[key]?.[value]) {
        result = mergeCss(result, variants[key][value])
      }
    }

    compoundVariants.forEach((compoundVariant) => {
      const isMatching = Object.entries(compoundVariant).every(([key, value]) => {
        if (key === 'css') return true

        const values = Array.isArray(value) ? value : [value]
        return values.some((value) => computedVariants[key] === value)
      })

      if (isMatching) {
        result = mergeCss(result, compoundVariant.css)
      }
    })

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