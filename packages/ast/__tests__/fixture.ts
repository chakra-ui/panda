import type * as swc from '@swc/core'
import { CallVisitor, DynamicCallVisitor } from '../src/visitor'
import { JSXPropVisitor } from '../src/jsx-visitor'
import { isValidCSSProp } from '@css-panda/is-valid-prop'

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
    const visitor = new JSXPropVisitor({
      import: { name: 'panda', module: '.panda/jsx' },
      onData(result) {
        collector.add({ name: 'panda', data: result.data })
      },
      isValidProp(prop) {
        return isValidCSSProp(prop)
      },
    })
    return visitor.visitProgram(program)
  }
}
