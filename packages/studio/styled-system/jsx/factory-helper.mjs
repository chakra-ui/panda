import { isCssProperty } from './is-valid-prop.mjs';

export const createShouldForwardProp = (options, variantKeys) => {
  const variantSet = new Set(variantKeys)
  const forwardFn = options.shouldForwardProp || ((prop) => !variantSet.has(prop) && !isCssProperty(prop))
  const forwardProps = options.forwardProps
  const forwardPropSet = forwardProps?.length ? new Set(forwardProps) : void 0
  return [
    forwardPropSet
      ? (prop) => forwardPropSet.has(prop) || forwardFn(prop, variantKeys)
      : (prop) => forwardFn(prop, variantKeys),
    variantSet,
  ]
}

export const composeShouldForwardProps = (tag, shouldForwardProp) =>
  tag.__shouldForwardProps__ && shouldForwardProp
    ? (propName) => tag.__shouldForwardProps__(propName) && shouldForwardProp(propName)
    : shouldForwardProp

export const composeCvaFn = (cvaA, cvaB) => {
  if (cvaA && !cvaB) return cvaA
  if (!cvaA && cvaB) return cvaB
  if ((cvaA.__cva__ && cvaB.__cva__) || (cvaA.__recipe__ && cvaB.__recipe__)) return cvaA.merge(cvaB)
  const error = new TypeError('Cannot merge cva with recipe. Please use either cva or recipe.')
  TypeError.captureStackTrace?.(error)
  throw error
}

export const getDisplayName = (Component) => {
  if (typeof Component === 'string') return Component
  return Component?.displayName || Component?.name || 'Component'
}

export const serializeSplitStyles = (css, propStyles, cssStyles, baseStyles) => {
  if (baseStyles !== void 0) {
    return propStyles ? cssStyles !== void 0 ? css(baseStyles, propStyles, cssStyles) : css(baseStyles, propStyles) : css(baseStyles, cssStyles)
  }
  return propStyles ? cssStyles !== void 0 ? css(propStyles, cssStyles) : css(propStyles) : css(cssStyles)
}