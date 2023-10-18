import { createElement, forwardRef, useMemo } from 'react'
import { css, cx, cva } from '../css/index.mjs';
import { splitProps, normalizeHTMLProps } from '../helpers.mjs';
import { isCssProperty } from './is-valid-prop.mjs';

const defaultShouldForwardProp = (prop, variantKeys) => !variantKeys.includes(prop) && !isCssProperty(prop)

const composeShouldForwardProps = (tag, _shouldForwardProp) =>
  tag.__shouldForwardProps__ && _shouldForwardProp
    ? (propName) => tag.__shouldForwardProps__(propName) && _shouldForwardProp(propName)
    : _shouldForwardProp

function styledFn(Dynamic, configOrCva = {}, options = {}) {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

  const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
  const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)
  
  const defaultProps = Object.assign(
    options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
    options.defaultProps,
  )

  const PandaComponent = /* @__PURE__ */ forwardRef(function PandaComponent(props, ref) {
    const { as: Element = Dynamic.__base__ || Dynamic, children, ...restProps } = props
    
    const __cvaFn__ = Dynamic.__cva__?.merge(cvaFn.config) ?? cvaFn
    const __shouldForwardProps__ = composeShouldForwardProps(Dynamic, shouldForwardProp)

    const combinedProps = useMemo(() => Object.assign({}, defaultProps, restProps), [restProps])

    const [forwardedProps, variantProps, styleProps, htmlProps, elementProps] = useMemo(() => {
      return splitProps(combinedProps, __shouldForwardProps__, __cvaFn__.variantKeys, isCssProperty, normalizeHTMLProps.keys)
    }, [combinedProps])

    function recipeClass() {
      const { css: cssStyles, ...propStyles } = styleProps
      const compoundVariantStyles = __cvaFn__.__getCompoundVariantCss__?.(variantProps)
      return cx(cvaFn(variantProps, false), css(compoundVariantStyles, propStyles, cssStyles), combinedProps.className)
    }

    function cvaClass() {
      const { css: cssStyles, ...propStyles } = styleProps
      const cvaStyles = __cvaFn__.raw(variantProps)
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
  PandaComponent.__cva__ = cvaFn
  PandaComponent.__base__ = Dynamic
  PandaComponent.__shouldForwardProps__ = shouldForwardProp
  
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
