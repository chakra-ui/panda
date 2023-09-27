import { createElement, forwardRef, useMemo } from 'react'
import { css, cx, cva } from '../css/index.mjs';
import { splitProps, normalizeHTMLProps } from '../helpers.mjs';
import { isCssProperty } from './is-valid-prop.mjs';

const defaultShouldForwardProp = (prop, variantKeys) => !variantKeys.includes(prop) && !isCssProperty(prop)

function styledFn(Dynamic, configOrCva = {}, options = {}) {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

  const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
  const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)
  const initialProps = Object.assign(
    options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
    options.defaultProps,
  )

  const PandaComponent = /* @__PURE__ */ forwardRef(function PandaComponent(props, ref) {
    const { as: Element = Dynamic, children, ...restProps } = props

    const combinedProps = useMemo(() => Object.assign({}, initialProps, restProps), [restProps])

    const [forwardedProps, variantProps, styleProps, htmlProps, elementProps] = useMemo(() => {
  return splitProps(combinedProps, shouldForwardProp, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
}, [combinedProps])

function recipeClass() {
  const { css: cssStyles, ...propStyles } = styleProps
  const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
  return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), combinedProps.className)
}

function cvaClass() {
  const { css: cssStyles, ...propStyles } = styleProps
  const cvaStyles = cvaFn.raw(variantProps)
  return cx(css(cvaStyles, propStyles, cssStyles), combinedProps.className)
}


    const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

    return createElement(Element, {
      ref,
      ...forwardedProps,
      ...elementProps,
      ...normalizeHTMLProps(htmlProps),
      children,
      className: classes(),
    })
  })

  const name = (typeof Dynamic === 'string' ? Dynamic : Dynamic.displayName || Dynamic.name) || 'Component'
  PandaComponent.displayName = `panda.${name}`
  return PandaComponent
}

function createJsxFactory() {
  const cache = new Map()

  return new Proxy(styledFn, {
    apply(_, __, args) {
      return styledFn(...args)
    },
    get(_, el) {
      if (!cache.has(el)) {
        cache.set(el, styledFn(el))
      }
      return cache.get(el)
    },
  })
}

export const panda = /* @__PURE__ */ createJsxFactory()
