import { PluginResult } from '@css-panda/types'
import * as swc from '@swc/core'
import { createDebug } from './debug'
import { Collector } from './types'
import { CallVisitor } from './visitor'

function createPlugin(name: string) {
  return function plugin(data: Set<PluginResult>, moduleName: string, fileName?: string) {
    return function (program: swc.Program) {
      const visitor = new CallVisitor({
        import: { name, module: moduleName, filename: fileName },
        onData(result) {
          createDebug(name, fileName, result)
          data.add(result)
        },
      })
      return visitor.visitProgram(program)
    }
  }
}

export const cssPlugin = createPlugin('css')
export const globalStylePlugin = createPlugin('globalStyle')
export const fontFacePlugin = createPlugin('fontFace')
export const cssMapPlugin = createPlugin('cssMap')

export function createCollector() {
  return {
    css: new Set<PluginResult>(),
    globalStyle: new Set<PluginResult>(),
    fontFace: new Set<PluginResult>(),
    cssMap: new Set<PluginResult>(),
    isEmpty() {
      return this.css.size === 0 && this.globalStyle.size === 0 && this.fontFace.size === 0 && this.cssMap.size === 0
    },
  }
}

export function createPlugins(data: Collector, moduleName: string, fileName?: string) {
  return [
    cssPlugin(data.css, moduleName, fileName),
    fontFacePlugin(data.fontFace, moduleName, fileName),
    globalStylePlugin(data.globalStyle, moduleName, fileName),
    cssMapPlugin(data.cssMap, moduleName, fileName),
  ]
}
