import type * as swc from '@swc/core';
import { CallVisitor } from './visitor';

export function cssPlugin(collector: Set<any>) {
  return function (program: swc.Program) {
    const visitor = new CallVisitor({
      import: { name: 'css', module: '.panda/css' },
      onData(result) {
        collector.add(result.data);
      },
    });
    return visitor.visitProgram(program);
  };
}
