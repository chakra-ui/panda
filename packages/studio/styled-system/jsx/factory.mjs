import { createElement, forwardRef, useMemo } from 'react'
import { css, cx, cva } from '../css/index.mjs';
import { splitProps, normalizeHTMLProps } from '../helpers.mjs';
import { isCssProperty } from './is-valid-prop.mjs';

function styledFn(Dynamic, configOrCva = {}, options = {}) {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

  const defaultShouldForwardProp = (prop) => !cvaFn.variantKeys.includes(prop) && !isCssProperty(prop)
  const { dataAttr, shouldForwardProp = defaultShouldForwardProp } = options
  const initialProps = Object.assign(
    dataAttr && configOrCva.recipeName ? { 'data-recipe': configOrCva.recipeName } : {},
    options.defaultProps,
  )

  const PandaComponent = /* @__PURE__ */ forwardRef(function PandaComponent(props, ref) {
    const { as: Element = Dynamic, ...restProps } = props

    const forwardedProps = useMemo(() => {
      const props = {}
      for (const key in restProps) {
        if (shouldForwardProp(key, isCssProperty)) {
          props[key] = restProps[key]
        }
      }

      return props
    }, [restProps, shouldForwardProp])

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
      ...initialProps,
      ...forwardedProps,
      ...elementProps,
      ...normalizeHTMLProps(htmlProps),
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
