import { compact, splitProps } from '../helpers.mjs';
import { css, mergeCss } from './css.mjs';

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
  
  const variantKeys = Object.keys(variants)

  function splitVariantProps(props) {
    return splitProps(props, variantKeys)
  }

  const variantMap = Object.fromEntries(Object.entries(variants).map(([key, value]) => [key, Object.keys(value)]))

  return Object.assign(cvaFn, {
    __cva__: true,
    variants: variantMap,
    variantKeys,
    resolve,
    config,
    splitVariantProps,
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
    throw new Error(`[recipe:${name}:${prop}] Conditions are not supported when using compound variants.`)
  }
}    
