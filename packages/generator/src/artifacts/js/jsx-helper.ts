import { ArtifactFile } from '../artifact-map'

export const jsxHelpersJsArtifact = new ArtifactFile({
  id: 'jsx/factory-helper.js',
  fileName: 'factory-helper',
  type: 'js',
  dir: (ctx) => ctx.paths.jsx,
  dependencies: ['syntax'],
  imports: (ctx) => {
    if (ctx.isTemplateLiteralSyntax) return {}

    return {
      'jsx/is-valid-prop.js': ['isCssProperty'],
    }
  },
  computed(ctx) {
    return { isTemplateLiteralSyntax: ctx.isTemplateLiteralSyntax, jsx: ctx.jsx }
  },
  code(params) {
    if (!params.computed.jsx.framework) return

    if (params.computed.isTemplateLiteralSyntax) {
      return `
    export const getDisplayName = (Component) => {
      if (typeof Component === 'string') return Component
      return Component?.displayName || Component?.name || 'Component'
    }`
    }

    return `
    export const defaultShouldForwardProp = (prop, variantKeys) => !variantKeys.includes(prop) && !isCssProperty(prop)

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
    }`
  },
})
