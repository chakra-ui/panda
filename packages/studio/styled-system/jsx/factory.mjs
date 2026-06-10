import { createElement, forwardRef } from 'react'
import { css, cx, cva } from '../css/index.mjs';
import { composeShouldForwardProps, composeCvaFn, createShouldForwardProp, getDisplayName, serializeSplitStyles } from './factory-helper.mjs';
import { isCssProperty } from './is-valid-prop.mjs';

const htmlPropsMap = {
  htmlWidth: 'width',
  htmlHeight: 'height',
  htmlTranslate: 'translate',
  htmlContent: 'content',
}
const hasOwn = Object.prototype.hasOwnProperty

function splitJsxProps(props, shouldForwardProp, variantSet) {
  let htmlProps
  let forwardedProps
  let variantProps
  let propStyles
  let cssStyles
  let elementProps
  const keys = Object.keys(props)
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const value = props[key]
    if (value === void 0) continue
    if (key === 'className' || key === 'as' || key === 'unstyled' || key === 'children') continue
    if (hasOwn.call(htmlPropsMap, key)) {
      htmlProps ||= Object.create(null)
      htmlProps[htmlPropsMap[key]] = value
    } else if (shouldForwardProp(key)) {
      forwardedProps ||= Object.create(null)
      forwardedProps[key] = value
    } else if (variantSet.has(key)) {
      variantProps ||= Object.create(null)
      variantProps[key] = value
    } else if (key === 'css') {
      cssStyles = value
    } else if (isCssProperty(key)) {
      ;(propStyles ||= {})[key] = value
    } else {
      elementProps ||= Object.create(null)
      elementProps[key] = value
    }
  }
  return [htmlProps, forwardedProps, variantProps || {}, propStyles, cssStyles, elementProps]
}

function styledFn(Dynamic, configOrCva = {}, options = {}) {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)
  const __cvaFn__ = composeCvaFn(Dynamic.__cva__, cvaFn)
  const variantKeys = __cvaFn__.variantKeys
  const [shouldForwardProp, variantSet] = createShouldForwardProp(options, variantKeys)
  
  const defaultProps = Object.assign(
    options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
    options.defaultProps,
  )
  const hasDefaultProps = Object.keys(defaultProps).length > 0

  const __shouldForwardProps__ = composeShouldForwardProps(Dynamic, shouldForwardProp)
  const __base__ = Dynamic.__base__ || Dynamic

  const PandaComponent = /* @__PURE__ */ forwardRef(function PandaComponent(props, ref) {
    const Element = props.as === void 0 ? __base__ : props.as
    const unstyled = props.unstyled
    const children = props.children
    let combinedProps = props
    if (hasDefaultProps) {
      const { as, unstyled, children, ...restProps } = props
      combinedProps = Object.assign({}, defaultProps, restProps)
    }
    const [htmlProps, forwardedProps, variantProps, propStyles, cssStyles, elementProps] = splitJsxProps(
      combinedProps,
      __shouldForwardProps__,
      variantSet,
    )
    const hasStyles = propStyles || cssStyles !== void 0
    let className
    if (unstyled) {
      className = cx(hasStyles && serializeSplitStyles(css, propStyles, cssStyles), combinedProps.className)
    } else if (configOrCva.__recipe__) {
      const compoundVariantStyles = __cvaFn__.__getCompoundVariantCss__?.(variantProps)
      className = cx(
        __cvaFn__(variantProps, false),
        (compoundVariantStyles || hasStyles) && serializeSplitStyles(css, propStyles, cssStyles, compoundVariantStyles),
        combinedProps.className,
      )
    } else {
      className = cx(
        hasStyles ? serializeSplitStyles(css, propStyles, cssStyles, __cvaFn__.raw(variantProps)) : __cvaFn__(variantProps),
        combinedProps.className,
      )
    }

    return createElement(Element, {
      ref,
      ...forwardedProps,
      ...elementProps,
      ...htmlProps,
      className,
    }, children ?? combinedProps.children)
  })

  const name = getDisplayName(__base__)

  PandaComponent.displayName = `panda.${name}`
  PandaComponent.__cva__ = __cvaFn__
  PandaComponent.__base__ = __base__
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
