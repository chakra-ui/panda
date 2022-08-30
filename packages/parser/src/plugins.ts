import { PluginResult } from '@css-panda/types'
import * as swc from '@swc/core'
import { createDebug } from './debug'
import { Collector } from './types'
import { CallVisitor } from './visitor'

export function cssPlugin(data: Set<PluginResult>, moduleName: string, fileName?: string) {
  return function (program: swc.Program) {
    const visitor = new CallVisitor({
      import: { name: 'css', module: moduleName, filename: fileName },
      onData(result) {
        createDebug('css', fileName, result)
        data.add(result)
      },
    })
    return visitor.visitProgram(program)
  }
}

export function globalStylePlugin(data: Set<PluginResult>, moduleName: string, fileName?: string) {
  return function (program: swc.Program) {
    const visitor = new CallVisitor({
      import: { name: 'globalStyle', module: moduleName, filename: fileName },
      onData(result) {
        createDebug('globalStyle', fileName, result)
        data.add(result)
      },
    })
    return visitor.visitProgram(program)
  }
}

export function fontFacePlugin(data: Set<PluginResult>, moduleName: string, fileName?: string) {
  return function (program: swc.Program) {
    const visitor = new CallVisitor({
      import: { name: 'fontFace', module: moduleName, filename: fileName },
      onData(result) {
        createDebug('fontFace', fileName, result)
        data.add(result)
      },
    })
    return visitor.visitProgram(program)
  }
}

export function createCollector() {
  return {
    css: new Set<PluginResult>(),
    globalStyle: new Set<PluginResult>(),
    fontFace: new Set<PluginResult>(),
    isEmpty() {
      return this.css.size === 0 && this.globalStyle.size === 0 && this.fontFace.size === 0
    },
  }
}

export function createPlugins(data: Collector, moduleName: string, fileName?: string) {
  return [
    cssPlugin(data.css, moduleName, fileName),
    fontFacePlugin(data.fontFace, moduleName, fileName),
    globalStylePlugin(data.globalStyle, moduleName, fileName),
  ]
}
