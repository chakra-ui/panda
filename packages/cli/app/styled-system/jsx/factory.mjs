import { createElement, forwardRef, useMemo } from 'react'
import { css, cx, cva, assignCss } from '../css/index.mjs';
import { splitProps, normalizeHTMLProps } from '../helpers.mjs';
import { isCssProperty } from './is-valid-prop.mjs';

function styled(Dynamic, configOrCva = {}) {
  const cvaFn = configOrCva.__cva__ ? configOrCva : cva(configOrCva)
  
  const PandaComponent = forwardRef(function PandaComponent(props, ref) {
    const { as: Element = Dynamic, ...restProps } = props

    const [styleProps, variantProps, htmlProps, elementProps] = useMemo(() => {
      return splitProps(restProps, isCssProperty, cvaFn.variantKeys, normalizeHTMLProps.keys)
    }, [restProps])

    function classes() {
      const { css: cssStyles, ...propStyles } = styleProps
      const cvaStyles = cvaFn.resolve(variantProps)
      const styles = assignCss(cvaStyles, propStyles, cssStyles)
      return cx(css(styles), elementProps.className)
    }

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

  return new Proxy(styled, {
    apply(_, __, args) {
      return styled(...args)
    },
    get(_, el) {
      if (!cache.has(el)) {
        cache.set(el, styled(el))
      }
      return cache.get(el)
    },
  })
}

export const panda = createJsxFactory()
