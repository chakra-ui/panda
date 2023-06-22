import { createElement, forwardRef, useMemo } from 'react'
import { css, cx, cva, assignCss } from '../css/index.mjs'
import { splitProps, normalizeHTMLProps } from '../helpers.mjs'
import { isCssProperty } from './is-valid-prop.mjs'

function styledFn(Dynamic, configOrCva = {}) {
  const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

  const PandaComponent = forwardRef(function PandaComponent(props, ref) {
    const { as: Element = Dynamic, ...restProps } = props

    const [variantProps, styleProps, htmlProps, elementProps] = useMemo(() => {
      return splitProps(restProps, cvaFn.variantKeys, isCssProperty, normalizeHTMLProps.keys)
    }, [restProps])

    function recipeClass() {
      const { css: cssStyles, ...propStyles } = styleProps
      const styles = assignCss(propStyles, cssStyles)
      return cx(cvaFn(variantProps), css(styles), elementProps.className)
    }

    function cvaClass() {
      const { css: cssStyles, ...propStyles } = styleProps
      const cvaStyles = cvaFn.resolve(variantProps)
      const styles = assignCss(cvaStyles, propStyles, cssStyles)
      return cx(css(styles), elementProps.className)
    }

    const classes = configOrCva.__recipe__ ? recipeClass : cvaClass

    return createElement(Element, {
      ref,
      ...elementProps,
      ...normalizeHTMLProps(htmlProps),
      className: classes(),
    })
  })

  PandaComponent.displayName = `panda.${Dynamic}`
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

export const panda = createJsxFactory()
