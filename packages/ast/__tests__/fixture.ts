import type * as swc from '@swc/core'
import { CallVisitor, DynamicCallVisitor } from '../src/visitor'
import { JSXVisitor } from '../src/jsx-visitor'
import { isCssProperty } from '@css-panda/is-valid-prop'

export function cssPlugin(collector: Set<any>) {
  return function (program: swc.Program) {
    const visitor = new CallVisitor({
      import: { name: 'css', module: '.panda/css' },
      onData(result) {
        collector.add(result.data)
      },
    })
    return visitor.visitProgram(program)
  }
}

export function recipePlugin(collector: Set<any>) {
  return function (program: swc.Program) {
    const visitor = new DynamicCallVisitor({
      import: { name: '*', module: '.panda/recipe' },
      onDynamicData(name, result) {
        collector.add({ name, data: result.data })
      },
    })
    return visitor.visitProgram(program)
  }
}

export function jsxPlugin(collector: Set<any>) {
  return function (program: swc.Program) {
    const visitor = new JSXVisitor({
      nodes: [],
      factory: 'panda',
      module: '.panda/jsx',
      onData(result) {
        collector.add({ name: 'panda', data: result.data })
      },
      isStyleProp(prop) {
        return isCssProperty(prop) || prop === 'css'
      },
    })
    return visitor.visitProgram(program)
  }
}

export function jsxPatternPlugin(collector: Set<any>) {
  return function (program: swc.Program) {
    const visitor = new JSXVisitor({
      nodes: [{ name: 'Stack', props: ['align', 'gap', 'direction'] }],
      factory: 'panda',
      module: '.panda/jsx',
      onData(result) {
        collector.add({ type: 'pattern', data: result.data, name: result.name })
      },
      isStyleProp(prop) {
        return isCssProperty(prop)
      },
    })
    return visitor.visitProgram(program)
  }
}
