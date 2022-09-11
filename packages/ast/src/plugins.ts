import { logger } from '@css-panda/logger'
import type { PluginResult } from '@css-panda/types'
import type * as swc from '@swc/core'
import type { Collector } from './types'
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
export const globalStylePlugin = createPlugin('globalStyle')
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

export function createCollector() {
  return {
    sx: new Set<PluginResult>(),
    css: new Set<PluginResult>(),
    globalStyle: new Set<PluginResult>(),
    fontFace: new Set<PluginResult>(),
    cssMap: new Set<PluginResult>(),
    recipe: new Map<string, Set<PluginResult>>(),
    pattern: new Map<string, Set<PluginResult>>(),
    isEmpty() {
      return (
        this.css.size === 0 &&
        this.sx.size === 0 &&
        this.globalStyle.size === 0 &&
        this.fontFace.size === 0 &&
        this.cssMap.size === 0 &&
        this.recipe.size === 0 &&
        this.pattern.size === 0
      )
    },
  }
}

export function createPlugins(
  data: Collector,
  importMap: Record<'css' | 'recipe' | 'pattern', string>,
  fileName?: string,
) {
  return [
    sxPlugin(data.css, importMap.css, fileName),
    cssPlugin(data.css, importMap.css, fileName),
    fontFacePlugin(data.fontFace, importMap.css, fileName),
    globalStylePlugin(data.globalStyle, importMap.css, fileName),
    cssMapPlugin(data.cssMap, importMap.css, fileName),
    dynamicPlugin(data.recipe, importMap.recipe, fileName),
    dynamicPlugin(data.pattern, importMap.pattern, fileName),
  ]
}
