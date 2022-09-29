import { isCssProperty } from '@css-panda/is-valid-prop'
import { logger } from '@css-panda/logger'
import type { PluginResult } from '@css-panda/types'
import type * as swc from '@swc/core'
import type { Collector } from './collector'
import { JSXPropVisitor } from './jsx-visitor'
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

export function jsxPlugin(
  data: Set<PluginResult>,
  jsxName: string,
  isUtilityProp: ((name: string) => boolean) | undefined,
  moduleName: string,
  fileName?: string,
) {
  return function (program: swc.Program) {
    const visitor = new JSXPropVisitor({
      import: { name: jsxName, module: moduleName, filename: fileName },
      onData(result) {
        logger.debug({ type: `ast:jsx`, fileName, result })
        data.add(result)
      },
      isValidProp(prop) {
        return isCssProperty(prop) || !!isUtilityProp?.(prop)
      },
    })
    return visitor.visitProgram(program)
  }
}

export type PluginOptions = {
  jsxName?: string
  data: Collector
  importMap: Record<'css' | 'recipe' | 'pattern' | 'jsx', string>
  fileName?: string
  isUtilityProp?: (prop: string) => boolean
}

export function createPlugins(options: PluginOptions) {
  const { jsxName = 'panda', data, importMap, fileName, isUtilityProp } = options
  return [
    sxPlugin(data.css, importMap.css, fileName),
    cssPlugin(data.css, importMap.css, fileName),
    fontFacePlugin(data.fontFace, importMap.css, fileName),
    globalCssPlugin(data.globalCss, importMap.css, fileName),
    cssMapPlugin(data.cssMap, importMap.css, fileName),
    dynamicPlugin(data.recipe, importMap.recipe, fileName),
    dynamicPlugin(data.pattern, importMap.pattern, fileName),
    jsxPlugin(data.jsx, jsxName, isUtilityProp, importMap.jsx, fileName),
  ]
}
