import { createElement, forwardRef } from 'react'
import { getDisplayName } from './factory-helper.mjs';
import { xcss, cx } from '../css/index.mjs';

function createStyledFn(Dynamic) {
  return function styledFn(template) {
    const styles = xcss.raw(template)

    const XPandaComponent = /* @__PURE__ */ forwardRef(function XPandaComponent(props, ref) {
      const { as: Element = Dynamic.__base__ || Dynamic, ...elementProps } = props

      function classes() {
        return cx(xcss(Dynamic.__styles__, styles), elementProps.className)
      }

      return createElement(Element, {
          ref,
          ...elementProps,
          className: classes(),
      })
    })

    const name = getDisplayName(Dynamic)

    XPandaComponent.displayName = `xpanda.${name}`
    XPandaComponent.__styles__ = styles
    XPandaComponent.__base__ = Dynamic

    return XPandaComponent
  }
}

function createJsxFactory() {
  const cache = new Map()

  return new Proxy(createStyledFn, {
    apply(_, __, args) {
      return createStyledFn(...args)
    },
    get(_, el) {
      if (!cache.has(el)) {
        cache.set(el, createStyledFn(el))
      }
      return cache.get(el)
    },
  })
}

export const xpanda = /* @__PURE__ */ createJsxFactory()
