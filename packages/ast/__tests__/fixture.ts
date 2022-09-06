import type * as swc from '@swc/core'
import { CallVisitor, DynamicCallVisitor } from '../src/visitor'

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
