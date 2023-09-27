import { createElement, forwardRef, useMemo } from 'react'
import { css, cx, cva } from '../css/index.mjs';
import { splitProps, normalizeHTMLProps } from '../helpers.mjs';
import { isCssProperty } from './is-valid-prop.mjs';

function styledFn(Dynamic, configOrCva = {}) {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

  const StyledComponent = /* @__PURE__ */ forwardRef(function StyledComponent(props, ref) {
    const { as: Element = Dynamic, ...restProps } = props

    const [variantProps, styleProps, htmlProps, elementProps] = useMemo(() => {
  return splitProps(restProps, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
}, [restProps])

function recipeClass() {
  const { css: cssStyles, ...propStyles } = styleProps
  const compoundVariantStyles = cvaFn.__getCompoundVariantCss__?.(variantProps);
  return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), elementProps.className)
}

function cvaClass() {
  const { css: cssStyles, ...propStyles } = styleProps
  const cvaStyles = cvaFn.raw(variantProps)
  return cx(css(cvaStyles, propStyles, cssStyles), elementProps.className)
}


    const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

    return createElement(Element, {
      ref,
      ...elementProps,
      ...normalizeHTMLProps(htmlProps),
      className: classes(),
    })
  })

  const name = (typeof Dynamic === 'string' ? Dynamic : Dynamic.displayName || Dynamic.name) || 'Component'
  StyledComponent.displayName = `styled.${name}`
  return StyledComponent
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

export const styled = /* @__PURE__ */ createJsxFactory()
