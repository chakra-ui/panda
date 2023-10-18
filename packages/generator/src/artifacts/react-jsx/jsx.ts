import { outdent } from 'outdent'
import type { Context } from '../../engines'

export function generateReactJsxFactory(ctx: Context) {
  const { factoryName, componentName } = ctx.jsx

  return {
    js: outdent`
    import { createElement, forwardRef, useMemo } from 'react'
    ${ctx.file.import('css, cx, cva', '../css/index')}
    ${ctx.file.import('splitProps, normalizeHTMLProps', '../helpers')}
    ${ctx.file.import('isCssProperty', './is-valid-prop')}

    const defaultShouldForwardProp = (prop, variantKeys) => !variantKeys.includes(prop) && !isCssProperty(prop)

    const composeShouldForwardProps = (tag, _shouldForwardProp) =>
      tag.__shouldForwardProps__ && _shouldForwardProp
        ? (propName) => tag.__shouldForwardProps__(propName) && _shouldForwardProp(propName)
        : _shouldForwardProp

    const composeCvaFn = (cvaA, cvaB) => {
      if (cvaA && !cvaB) return cvaA
      if (!cvaA && cvaB) return cvaB
      if ((cvaA.__cva__ && cvaB.__cva__) || (cvaA.__recipe__ && cvaB.__recipe__)) return cvaA.merge(cvaB.config)
      const error = new TypeError('Cannot merge cva with recipe. Please use either cva or recipe.')
      TypeError.captureStackTrace?.(error)
      throw error
    }
    
    function styledFn(Dynamic, configOrCva = {}, options = {}) {
      const cvaFn = configOrCva.__cva__ || configOrCva.__recipe__ ? configOrCva : cva(configOrCva)

      const forwardFn = options.shouldForwardProp || defaultShouldForwardProp
      const shouldForwardProp = (prop) => forwardFn(prop, cvaFn.variantKeys)
      
      const defaultProps = Object.assign(
        options.dataAttr && configOrCva.__name__ ? { 'data-recipe': configOrCva.__name__ } : {},
        options.defaultProps,
      )

      const ${componentName} = /* @__PURE__ */ forwardRef(function ${componentName}(props, ref) {
        const { as: Element = Dynamic.__base__ || Dynamic, children, ...restProps } = props
        
        const __cvaFn__ = composeCvaFn(Dynamic.__cva__, cvaFn)
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
      
      ${componentName}.displayName = \`${factoryName}.\${name}\`
      ${componentName}.__cva__ = cvaFn
      ${componentName}.__base__ = Dynamic
      ${componentName}.__shouldForwardProps__ = shouldForwardProp
      
      return ${componentName}
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

    export const ${factoryName} = /* @__PURE__ */ createJsxFactory()

    `,
  }
}
