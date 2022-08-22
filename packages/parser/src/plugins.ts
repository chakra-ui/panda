import { createDebugger } from '@css-panda/logger'
import { PluginResult } from '@css-panda/types'
import * as swc from '@swc/core'
import { Collector } from './types'
import { CallVisitor } from './visitor'

export function cssPlugin(data: Set<PluginResult>, moduleName: string) {
  return function (program: swc.Program) {
    const visitor = new CallVisitor({
      import: { name: 'css', module: moduleName },
      onData(result) {
        createDebugger('plugin:css')(result)
        data.add(result)
      },
    })
    return visitor.visitProgram(program)
  }
}

export function globalStylePlugin(data: Set<PluginResult>, moduleName: string) {
  return function (program: swc.Program) {
    const visitor = new CallVisitor({
      import: { name: 'globalStyle', module: moduleName },
      onData(result) {
        createDebugger('plugin:global-style')(result)
        data.add(result)
      },
    })
    return visitor.visitProgram(program)
  }
}

export function fontFacePlugin(data: Set<PluginResult>, moduleName: string) {
  return function (program: swc.Program) {
    const visitor = new CallVisitor({
      import: { name: 'fontFace', module: moduleName },
      onData(result) {
        createDebugger('plugin:font-face')(result)
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

export function createPlugins(data: Collector, moduleName = '.panda/css') {
  return [
    cssPlugin(data.css, moduleName),
    // fontFacePlugin(data.fontFace, moduleName),
    // globalStylePlugin(data.globalStyle, moduleName),
  ]
}
