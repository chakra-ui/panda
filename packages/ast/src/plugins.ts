import { isCssProperty } from '@css-panda/is-valid-prop'
import { logger } from '@css-panda/logger'
import type { PluginResult } from '@css-panda/types'
import type * as swc from '@swc/core'
import type { Collector } from './collector'
import { JsxNode, JSXVisitor, JsxVisitorOptions } from './jsx-visitor'
import { CallVisitor, DynamicCallVisitor } from './visitor'

function createPlugin(name: string) {
  return function plugin(data: Set<PluginResult>, moduleName: string, fileName?: string) {
    return function (program: swc.Program) {
      const visitor = new CallVisitor({
        import: { name, module: moduleName, filename: fileName },
        onData(result) {
          logger.debug({ type: `ast:${name}`, fileName, result })
          data.add(result)
        },
      })
      return visitor.visitProgram(program)
    }
  }
}

export const cssPlugin = createPlugin('css')
export const sxPlugin = createPlugin('sx')
export const globalCssPlugin = createPlugin('globalCss')
export const fontFacePlugin = createPlugin('fontFace')
export const cssMapPlugin = createPlugin('cssMap')

export function dynamicPlugin(data: Map<string, Set<PluginResult>>, moduleName: string, fileName?: string) {
  return function (program: swc.Program) {
    const visitor = new DynamicCallVisitor({
      import: { name: '*', module: moduleName, filename: fileName },
      onDynamicData(name, result) {
        logger.debug({ type: `ast:${name}`, fileName, result })
        data.set(name, data.get(name) || new Set())
        data.get(name)!.add(result)
      },
    })
    return visitor.visitProgram(program)
  }
}

export function jsxPlugin(data: Set<PluginResult>, options: Omit<JsxVisitorOptions, 'onData'>) {
  const { isStyleProp, fileName } = options

  return function (program: swc.Program) {
    const visitor = new JSXVisitor({
      ...options,
      onData(result) {
        logger.debug({ type: `ast:jsx`, fileName, result })
        data.add(result)
      },
      isStyleProp(prop) {
        return isCssProperty(prop) || isStyleProp?.(prop)
      },
    })
    return visitor.visitProgram(program)
  }
}

export type PluginOptions = {
  importMap: Record<'css' | 'recipe' | 'pattern' | 'jsx', string>
  fileName?: string
  jsx?: {
    factory: string
    nodes: JsxNode[]
    isStyleProp: (prop: string) => boolean
  }
}

export function createPlugins(data: Collector, options: PluginOptions) {
  const { jsx, importMap, fileName } = options
  return [
    sxPlugin(data.css, importMap.css, fileName),
    cssPlugin(data.css, importMap.css, fileName),
    fontFacePlugin(data.fontFace, importMap.css, fileName),
    globalCssPlugin(data.globalCss, importMap.css, fileName),
    cssMapPlugin(data.cssMap, importMap.css, fileName),
    dynamicPlugin(data.recipe, importMap.recipe, fileName),
    dynamicPlugin(data.pattern, importMap.pattern, fileName),
    jsx
      ? jsxPlugin(data.jsx, {
          factory: jsx.factory,
          module: importMap.jsx,
          nodes: jsx.nodes,
          isStyleProp: jsx.isStyleProp,
          fileName,
        })
      : undefined,
  ].filter(Boolean) as swc.Plugin[]
}
